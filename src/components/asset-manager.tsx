"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Maybe } from "purify-ts/Maybe";

import { Button } from "@/components/button";
import { AssetList } from "@/components/asset-list";
import { logger } from "@/lib/logger";
import { Image } from "@/components/image";
import { Audio } from "@/components/audio";
import { Video } from "@/components/video";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "@/app/api/assets/presign/put/types";
import {
  JobStartResponse,
  TranscriptionJobStatusResponse,
} from "@/lambda/worker/job.types";
import { AssetItemWithPreview, AssetVariant } from "@/components/assets/asset.types";

const TRANSCRIPTION_POLL_MAX_ATTEMPTS = 150;

const getTranscriptionPollDelayMs = ({
  attemptNumber,
}: {
  attemptNumber: number;
}) => {
  return attemptNumber <= 30 ? 2000 : 5000;
};

const AudioRecorderInput = dynamic(
  () =>
    import("@/components/audio-recorder-input").then(
      (module) => module.AudioRecorderInput,
    ),
  { ssr: false },
);

type UploadStatus = "uploading" | "error";

interface UploadItem {
  localId: string;
  file: File;
  previewUrl: string;
  fileSizeBytes: number;
  caption: string;
  variant: AssetVariant;
  status: UploadStatus;
  source: "file" | "recorder";
  transcriptionMode?: "auto" | "skip";
  error?: string;
}

const getVariant = (file: File): AssetVariant | null => {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return null;
};

const formatFileSize = ({ fileSizeBytes }: { fileSizeBytes: number }) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = fileSizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
};

export const AssetManager: React.FC<{
  initialUploadedAssets: AssetItemWithPreview[];
  name?: string;
  onAssetsChangeAction?: (assets: AssetItemWithPreview[]) => void;
  onTranscribeChangeAction?: (
    uploadedAsset: AssetItemWithPreview,
    transcription: {
      transcriptionStructured: string;
      transcriptionRaw: string;
    },
  ) => void;
  shouldEnableTranscription?: boolean;
  shouldShowRecorder?: boolean;
  shouldShowCaptionField?: boolean;
  shouldHideAddFilesWhenHasAssets?: boolean;
  shouldShowRecorderTranscribeOption?: boolean;
  allowedVariants?: AssetVariant[];
  multiple?: boolean;
}> = ({
  initialUploadedAssets,
  name,
  onAssetsChangeAction,
  onTranscribeChangeAction,
  shouldEnableTranscription = Boolean(onTranscribeChangeAction),
  shouldShowRecorder = true,
  shouldShowCaptionField = true,
  shouldHideAddFilesWhenHasAssets = false,
  shouldShowRecorderTranscribeOption = true,
  allowedVariants = ["audio", "image", "video"],
  multiple = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const uploadedAssetsRef = useRef<AssetItemWithPreview[]>(initialUploadedAssets);
  const unsavedUploadsRef = useRef<UploadItem[]>([]);
  const onAssetsChangeActionRef = useRef(onAssetsChangeAction);
  const [uploadedAssets, setUploadedAssets] = useState<AssetItemWithPreview[]>(
    initialUploadedAssets,
  );
  const [unsavedUploads, setUnsavedUploads] = useState<UploadItem[]>([]);
  const [transcribeStatusByFilename, setTranscribeStatusByFilename] = useState<
    Record<string, "idle" | "loading" | "done" | "error">
  >({});
  const [recordingTranscriptionModeByFilename, setRecordingTranscriptionModeByFilename] =
    useState<Record<string, "auto" | "skip">>({});

  useEffect(() => {
    uploadedAssetsRef.current = uploadedAssets;
  }, [uploadedAssets]);

  useEffect(() => {
    onAssetsChangeActionRef.current = onAssetsChangeAction;
  }, [onAssetsChangeAction]);

  useEffect(() => {
    onAssetsChangeActionRef.current?.(uploadedAssets);
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
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      uploadedAssetsRef.current.forEach((asset) => {
        revokePreviewUrl(asset.previewUrl);
      });

      unsavedUploadsRef.current.forEach((upload) => {
        revokePreviewUrl(upload.previewUrl);
      });
    };
  }, []);

  const setTranscribeStatus = ({
    filename,
    status,
  }: {
    filename: string;
    status: "idle" | "loading" | "done" | "error";
  }) => {
    if (!isMountedRef.current) {
      return;
    }

    setTranscribeStatusByFilename((current) => ({
      ...current,
      [filename]: status,
    }));
  };

  const serializedAssets = useMemo(() => {
    return JSON.stringify(
      uploadedAssets.map((asset) => ({
        caption: asset.caption,
        filename: asset.filename,
        variant: asset.variant,
        fileSizeBytes: asset.fileSizeBytes,
        transcriptionMetadata: asset.transcriptionMetadata,
      })),
    );
  }, [uploadedAssets]);

  const statusMessage = useMemo(() => {
    const hasUploadingAssets = unsavedUploads.some(
      (upload) => upload.status === "uploading",
    );
    const hasTranscribingAssets = shouldEnableTranscription
      ? Object.values(transcribeStatusByFilename).includes("loading")
      : false;

    if (hasUploadingAssets && hasTranscribingAssets) {
      return "Uploading assets and transcribing audio...";
    }

    if (hasUploadingAssets) {
      return "Uploading assets...";
    }

    if (hasTranscribingAssets) {
      return "Transcribing audio...";
    }

    return null;
  }, [shouldEnableTranscription, transcribeStatusByFilename, unsavedUploads]);

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

      if (!allowedVariants.includes(variant)) {
        return throwE(`Unsupported file variant '${variant}'`);
      }

      try {
        const body = await liftEither(
          AssetsPresignPutObjectBody.decode({
            filename: file.name,
            contentType: file.type,
            variant,
          }).map((decodedBody) => JSON.stringify(decodedBody)),
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
          EitherAsync(async ({ liftEither: liftEitherInner }) => {
            const json = await presignPutResponse.json();

            return liftEitherInner(AssetsPresignPutObjectResponse.decode(json));
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

    if (!variant || !allowedVariants.includes(variant)) {
      logger.error("Missing or invalid file type.");

      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const localId = `${file.name}-${file.size}-${file.lastModified}`;
    const uploadItem: UploadItem = {
      localId,
      file,
      previewUrl,
      fileSizeBytes: file.size,
      caption: file.name,
      variant,
      status: "uploading",
      source: options?.source ?? "file",
      transcriptionMode: options?.transcriptionMode,
    };

    setUnsavedUploads((current) => {
      if (multiple) {
        return [...current, uploadItem];
      }

      current.forEach((item) => revokePreviewUrl(item.previewUrl));
      return [uploadItem];
    });

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
        const uploadedAsset: AssetItemWithPreview = {
          filename,
          variant: upload.variant,
          caption: upload.caption,
          previewUrl: upload.previewUrl,
          fileSizeBytes: upload.fileSizeBytes,
          transcriptionMetadata: undefined,
        };

        setUploadedAssets((current) => {
          if (multiple) {
            return [...current, uploadedAsset];
          }

          current.forEach((asset) => revokePreviewUrl(asset.previewUrl));
          return [uploadedAsset];
        });

        setUnsavedUploads((current) =>
          current.filter((item) => item.localId !== upload.localId),
        );

        if (
          shouldEnableTranscription &&
          upload.source === "recorder" &&
          upload.variant === "audio" &&
          upload.transcriptionMode
        ) {
          const transcriptionMode = upload.transcriptionMode;
          setRecordingTranscriptionModeByFilename((current) => ({
            ...current,
            [filename]: transcriptionMode,
          }));
        }

        if (
          shouldEnableTranscription &&
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

    if (!multiple && files.length > 0) {
      startUpload(files[0], { source: "file" });
    } else {
      files.forEach((file) => startUpload(file, { source: "file" }));
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const onRemoveClick = async (
    asset: Pick<AssetItemWithPreview, "filename" | "previewUrl">,
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
        Object.entries(current).filter(
          ([filename]) => filename !== asset.filename,
        ),
      );
    });
  };

  const onTranscribeClick = async (asset: AssetItemWithPreview) => {
    if (!shouldEnableTranscription) {
      return;
    }

    await EitherAsync(async ({ liftEither, throwE }) => {
      setTranscribeStatus({ filename: asset.filename, status: "loading" });

      const response = await fetch(
        `/api/assets/${encodeURIComponent(asset.filename)}/transcriptions`,
        { method: "POST" },
      );

      if (!response.ok) {
        return throwE("Failed to start transcription");
      }

      const startJson = await response.json();
      const { jobId } = await liftEither(JobStartResponse.decode(startJson));

      let attempts = 0;

      while (attempts < TRANSCRIPTION_POLL_MAX_ATTEMPTS) {
        attempts += 1;
        if (attempts > 1) {
          const pollDelayMs = getTranscriptionPollDelayMs({
            attemptNumber: attempts - 1,
          });

          await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
        }

        let statusResponse: Response;

        try {
          statusResponse = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
            method: "GET",
            cache: "no-store",
          });
        } catch (error) {
          logger.error("Failed to poll transcription job status", error);
          continue;
        }

        if (!statusResponse.ok) {
          logger.error(
            "Failed to load transcription job status",
            statusResponse,
          );
          return throwE("Failed to load transcription job status");
        }

        const statusJson = await liftEither(
          TranscriptionJobStatusResponse.decode(await statusResponse.json()),
        );

        if (statusJson.status === "succeeded") {
          if (isMountedRef.current) {
            setUploadedAssets((current) =>
              current.map((item) =>
                item.filename === asset.filename
                  ? {
                      ...item,
                      transcriptionMetadata: statusJson.metadata,
                    }
                  : item,
              ),
            );
            onTranscribeChangeAction?.(asset, {
              transcriptionStructured: statusJson.transcriptionStructured,
              transcriptionRaw: statusJson.transcriptionRaw ?? "",
            });
            setTranscribeStatus({ filename: asset.filename, status: "done" });
          }
          return;
        }

        if (statusJson.status === "failed") {
          logger.error("Transcription job failed", statusJson.error);
          return throwE("Transcription job failed");
        }
      }
    }).mapLeft((error) => {
      if (isMountedRef.current) {
        logger.error("Failed to transcribe asset", error);
        setTranscribeStatus({ filename: asset.filename, status: "error" });
      }
    });
  };

  const onCaptionChange = (asset: AssetItemWithPreview, caption: string) => {
    setUploadedAssets((current) =>
      current.map((item) =>
        item.filename === asset.filename ? { ...item, caption } : item,
      ),
    );
  };

  const acceptValues: string[] = [];

  if (allowedVariants.includes("image")) {
    acceptValues.push("image/*");
  }

  if (allowedVariants.includes("audio")) {
    acceptValues.push("audio/*", ".mp3", ".wav", "audio/mpeg");
  }

  if (allowedVariants.includes("video")) {
    acceptValues.push(
      "video/*",
      ".mp4",
      ".mov",
      ".m4v",
      "video/mp4",
      "video/quicktime",
    );
  }

  const accept = acceptValues.join(",");

  const shouldShowTranscribe = shouldEnableTranscription;
  const shouldShowRecorderControl =
    shouldShowRecorder &&
    allowedVariants.includes("audio") &&
    (!shouldHideAddFilesWhenHasAssets || uploadedAssets.length === 0);
  const shouldShowAddFilesButton =
    !shouldHideAddFilesWhenHasAssets || uploadedAssets.length === 0;

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onChange}
        multiple={multiple}
      />

      {name && (
        <input
          type="hidden"
          name={name}
          value={serializedAssets}
          readOnly
          className="sr-only"
        />
      )}

      {unsavedUploads.length > 0 && (
        <div className="space-y-4">
          {unsavedUploads.map((upload) => (
            <div key={upload.localId} className="space-y-2">
              <div className="flex items-end justify-between text-xs text-zinc-900 dark:text-zinc-100 pb-1">
                <div className="min-w-0">
                  <p className="truncate -mb-1">{upload.caption}</p>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                    {formatFileSize({ fileSizeBytes: upload.fileSizeBytes })}
                  </p>
                </div>
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
              ) : upload.variant === "video" ? (
                <Video src={upload.previewUrl} />
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
        shouldShowCaptionField={shouldShowCaptionField}
        onTranscribeClick={shouldShowTranscribe ? onTranscribeClick : undefined}
        transcribeStatusByFilename={transcribeStatusByFilename}
        shouldShowTranscribeButton={(asset, status) => {
          if (!shouldShowTranscribe || asset.variant !== "audio") {
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

      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2">
          {shouldShowRecorderControl && (
            <AudioRecorderInput
              onChangeAction={onRecordAudioFinished}
              shouldShowTranscribeOption={shouldShowRecorderTranscribeOption}
            />
          )}

          {shouldShowAddFilesButton && (
            <Button type="button" variant="outline" onClick={onAddFilesClick}>
              Add files
            </Button>
          )}
        </div>

        {statusMessage && (
          <div className="min-h-4 text-right text-xs text-zinc-600 dark:text-zinc-400">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
