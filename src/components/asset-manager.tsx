"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/button";
import { AssetList } from "@/components/asset-list";
import {
  JournalAsset,
  JournalAssetVariant,
} from "@/app/journals/journal.types";
import { logger } from "@/lib/logger";
import { Image } from "@/components/image";
import { Audio } from "@/components/audio";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "@/app/api/assets/presign/put/types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Maybe } from "purify-ts/Maybe";

const AudioRecorderInput = dynamic(
  () =>
    import("@/components/audio-recorder-input").then(
      (module) => module.AudioRecorderInput,
    ),
  { ssr: false },
);

interface UploadedAssetItem extends JournalAsset {
  previewUrl: string;
}

type UploadStatus = "uploading" | "error";

interface UploadItem {
  localId: string;
  file: File;
  previewUrl: string;
  caption: string;
  variant: JournalAssetVariant;
  status: UploadStatus;
  source: "file" | "recorder";
  transcriptionMode?: "auto" | "skip";
  error?: string;
}

const getVariant = (file: File): JournalAssetVariant | null => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return null;
};

export const AssetManager: React.FC<{
  name: string;
  initialUploadedAssets: UploadedAssetItem[];
  onTranscribeChangeAction?: (
    uploadedAsset: UploadedAssetItem,
    text: string,
  ) => void;
}> = ({ name, initialUploadedAssets, onTranscribeChangeAction }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedAssetsRef = useRef<UploadedAssetItem[]>(initialUploadedAssets);
  const unsavedUploadsRef = useRef<UploadItem[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>(
    initialUploadedAssets,
  );
  // For UI while uploading files, i.e. error handling, previews, etc. before it's in S3
  const [unsavedUploads, setUnsavedUploads] = useState<UploadItem[]>([]);
  const [transcribeStatusByFilename, setTranscribeStatusByFilename] = useState<
    Record<string, "idle" | "loading" | "done" | "error">
  >({});
  const [
    recordingTranscriptionModeByFilename,
    setRecordingTranscriptionModeByFilename,
  ] = useState<Record<string, "auto" | "skip">>({});

  useEffect(() => {
    uploadedAssetsRef.current = uploadedAssets;
  }, [uploadedAssets]);

  useEffect(() => {
    unsavedUploadsRef.current = unsavedUploads;
  }, [unsavedUploads]);

  const revokePreviewUrl = (previewUrl: string) => {
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  useEffect(() => {
    return () => {
      uploadedAssetsRef.current.forEach((asset) => {
        revokePreviewUrl(asset.previewUrl);
      });

      unsavedUploadsRef.current.forEach((upload) => {
        revokePreviewUrl(upload.previewUrl);
      });
    };
  }, []);

  const serializedAssets = useMemo(() => {
    return JSON.stringify(
      uploadedAssets.map((asset) => ({
        caption: asset.caption,
        filename: asset.filename,
        variant: asset.variant,
      })),
    );
  }, [uploadedAssets]);

  const onAddFilesClick = () => {
    inputRef.current?.click();
  };

  const onRecordAudioFinished = async (
    file: File | null,
    options?: { transcriptionMode: "auto" | "skip" },
  ) => {
    if (!file) {
      return;
    }

    startUpload(file, {
      source: "recorder",
      transcriptionMode: options?.transcriptionMode ?? "auto",
    });
  };

  const uploadFile = (
    file: File,
  ): EitherAsync<unknown, { filename: string }> => {
    return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
      const variant = await liftEither(
        Maybe.fromNullable(getVariant(file)).toEither(
          "Missing or invalid file type.",
        ),
      );

      try {
        const body = await liftEither(
          AssetsPresignPutObjectBody.decode({
            filename: file.name,
            contentType: file.type,
            variant,
          }).map((body) => JSON.stringify(body)),
        );

        const presignPutResponse = await fetch("/api/assets/presign/put", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        });

        if (!presignPutResponse.ok) {
          logger.error(presignPutResponse);

          return throwE("Failed to fetch presigned URL");
        }

        const { uploadUrl, filename } = await fromPromise(
          EitherAsync(async ({ liftEither }) => {
            const json = await presignPutResponse.json();

            return liftEither(AssetsPresignPutObjectResponse.decode(json));
          }),
        );

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: file.type ? { "Content-Type": file.type } : undefined,
          body: file,
        });

        if (!uploadResponse.ok) {
          logger.error(uploadResponse);

          return throwE("Failed to upload asset.");
        }

        return { filename };
      } catch (error) {
        logger.error("Failed to upload assets", error);

        return throwE(error);
      }
    });
  };

  const startUpload = (
    file: File,
    options?: {
      source?: "file" | "recorder";
      transcriptionMode?: "auto" | "skip";
    },
  ) => {
    const variant = getVariant(file);

    if (!variant) {
      logger.error("Missing or invalid file type.");

      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const localId = `${file.name}-${file.size}-${file.lastModified}`;
    const uploadItem: UploadItem = {
      localId,
      file,
      previewUrl,
      caption: file.name,
      variant,
      status: "uploading",
      source: options?.source ?? "file",
      transcriptionMode: options?.transcriptionMode,
    };

    setUnsavedUploads((current) => [...current, uploadItem]);

    void performUpload(uploadItem);
  };

  const performUpload = async (upload: UploadItem) => {
    setUnsavedUploads((current) =>
      current.map((item) =>
        item.localId === upload.localId
          ? { ...item, status: "uploading", error: undefined }
          : item,
      ),
    );

    const response = await uploadFile(upload.file).run();

    response.caseOf({
      Left: (error) => {
        const errorMessage = String(error);
        logger.error("Failed to upload assets", errorMessage);

        setUnsavedUploads((current) =>
          current.map((item) =>
            item.localId === upload.localId
              ? { ...item, status: "error", error: errorMessage }
              : item,
          ),
        );
      },
      Right: ({ filename }) => {
        const uploadedAsset: UploadedAssetItem = {
          filename,
          variant: upload.variant,
          caption: upload.caption,
          previewUrl: upload.previewUrl,
        };

        setUploadedAssets((current) => [...current, uploadedAsset]);

        setUnsavedUploads((current) =>
          current.filter((item) => item.localId !== upload.localId),
        );

        if (
          upload.source === "recorder" &&
          upload.variant === "audio" &&
          upload.transcriptionMode
        ) {
          setRecordingTranscriptionModeByFilename((current) => ({
            ...current,
            [filename]: upload.transcriptionMode!,
          }));
        }

        if (
          upload.source === "recorder" &&
          upload.variant === "audio" &&
          upload.transcriptionMode === "auto"
        ) {
          void onTranscribeClick(uploadedAsset);
        }
      },
    });
  };

  const removeUpload = (upload: UploadItem) => {
    revokePreviewUrl(upload.previewUrl);
    setUnsavedUploads((current) =>
      current.filter((item) => item.localId !== upload.localId),
    );
  };

  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    files.forEach((file) => startUpload(file, { source: "file" }));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onRemoveClick = async (
    asset: Pick<UploadedAssetItem, "filename" | "previewUrl">,
  ) => {
    const response = await fetch(
      `/api/assets/${encodeURIComponent(asset.filename)}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      logger.error("Failed to delete asset");
      return;
    }

    revokePreviewUrl(asset.previewUrl);
    setUploadedAssets((current) =>
      current.filter((item) => item.filename !== asset.filename),
    );
    setRecordingTranscriptionModeByFilename((current) => {
      return Object.fromEntries(
        Object.entries(current).filter(([filename]) => filename !== asset.filename),
      );
    });
  };

  const onTranscribeClick = async (asset: UploadedAssetItem) => {
    setTranscribeStatusByFilename((current) => ({
      ...current,
      [asset.filename]: "loading",
    }));

    const response = await fetch(
      `/api/assets/${encodeURIComponent(asset.filename)}/transcriptions`,
      { method: "POST" },
    );

    if (!response.ok) {
      logger.error("Failed to transcribe asset", response);
      setTranscribeStatusByFilename((current) => ({
        ...current,
        [asset.filename]: "error",
      }));
      return;
    }

    const json = await response.json();
    if (typeof json?.text === "string") {
      onTranscribeChangeAction?.(asset, json.text);
      setTranscribeStatusByFilename((current) => ({
        ...current,
        [asset.filename]: "done",
      }));
      return;
    }

    setTranscribeStatusByFilename((current) => ({
      ...current,
      [asset.filename]: "error",
    }));
  };

  const onCaptionChange = (asset: UploadedAssetItem, caption: string) => {
    setUploadedAssets((current) =>
      current.map((item) =>
        item.filename === asset.filename ? { ...item, caption } : item,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,audio/*,.mp3,.wav,audio/mpeg"
        className="sr-only"
        onChange={onChange}
        multiple
      />

      <input
        type="hidden"
        name={name}
        value={serializedAssets}
        readOnly
        className="sr-only"
      />

      {unsavedUploads.length > 0 && (
        <div className="space-y-4">
          {unsavedUploads.map((upload) => (
            <div key={upload.localId} className="space-y-2">
              <div className="flex items-end justify-between text-xs text-zinc-900 dark:text-zinc-100 pb-1">
                <p className="truncate -mb-1">{upload.caption}</p>
                <div className="flex space-x-1">
                  {upload.status === "error" && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => performUpload(upload)}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => removeUpload(upload)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {upload.variant === "image" ? (
                <Image src={upload.previewUrl} alt={upload.caption} />
              ) : (
                <Audio src={upload.previewUrl} />
              )}

              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                {upload.status === "uploading" && "Uploading..."}
                {upload.status === "error" &&
                  (upload.error
                    ? `Upload failed: ${upload.error}`
                    : "Upload failed.")}
              </div>
            </div>
          ))}
        </div>
      )}

      <AssetList
        assets={uploadedAssets}
        onRemoveClick={onRemoveClick}
        onCaptionChange={onCaptionChange}
        onTranscribeClick={onTranscribeClick}
        transcribeStatusByFilename={transcribeStatusByFilename}
        shouldShowTranscribeButton={(asset, status) => {
          if (asset.variant !== "audio") {
            return false;
          }

          const recordingMode =
            recordingTranscriptionModeByFilename[asset.filename];

          if (recordingMode === "auto") {
            return status === "error";
          }

          return true;
        }}
      />

      <div className="flex justify-end items-center space-x-2">
        <AudioRecorderInput onChangeAction={onRecordAudioFinished} />

        <Button type="button" variant="outline" onClick={onAddFilesClick}>
          Add files
        </Button>
      </div>
    </div>
  );
};
