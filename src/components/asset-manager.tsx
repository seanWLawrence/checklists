"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/button";
import { AssetList } from "@/components/asset-list";
import { logger } from "@/lib/logger";
import { Image } from "@/components/image";
import { Audio } from "@/components/audio";
import { Video } from "@/components/video";
import { uploadAsset, getAssetVariant } from "@/lib/upload-asset";
import {
  AssetItemWithPreview,
  AssetVariant,
} from "@/components/assets/asset.types";
import { useTranscription } from "@/hooks/use-transcription";

const ALLOWED_VARIANTS = ["audio", "image", "video"];
const accept = [
  "image/*",
  "audio/*",
  ".mp3",
  ".wav",
  "audio/mpeg",
  "video/*",
  ".mp4",
  ".mov",
  ".m4v",
  "video/mp4",
  "video/quicktime",
].join(",");

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
  onTranscribingChangeAction?: (isTranscribing: boolean) => void;
  onUploadingChangeAction?: (isUploading: boolean) => void;
  onRecordingChangeAction?: (isRecording: boolean) => void;
  shouldEnableTranscription?: boolean;
  shouldShowRecorder?: boolean;
  shouldShowCaptionField?: boolean;
  shouldHideAddFilesWhenHasAssets?: boolean;
  shouldShowRecorderTranscribeOption?: boolean;
  multiple?: boolean;
}> = ({
  initialUploadedAssets,
  name,
  onAssetsChangeAction,
  onTranscribeChangeAction,
  onTranscribingChangeAction,
  onUploadingChangeAction,
  onRecordingChangeAction,
  shouldEnableTranscription = Boolean(onTranscribeChangeAction),
  shouldShowRecorder = true,
  shouldShowCaptionField = true,
  shouldHideAddFilesWhenHasAssets = false,
  shouldShowRecorderTranscribeOption = true,
  multiple = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const uploadedAssetsRef = useRef<AssetItemWithPreview[]>(
    initialUploadedAssets,
  );
  const unsavedUploadsRef = useRef<UploadItem[]>([]);
  const onAssetsChangeActionRef = useRef(onAssetsChangeAction);
  const [uploadedAssets, setUploadedAssets] = useState<AssetItemWithPreview[]>(
    initialUploadedAssets,
  );
  const [unsavedUploads, setUnsavedUploads] = useState<UploadItem[]>([]);
  const [
    recordingTranscriptionModeByFilename,
    setRecordingTranscriptionModeByFilename,
  ] = useState<Record<string, "auto" | "skip">>({});

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

  const {
    startTranscription,
    clearTranscriptionState,
    statusByFilename: transcribeStatusByFilename,
    isTranscribing,
  } = useTranscription({
    onCompleted: ({
      filename,
      transcriptionStructured,
      transcriptionRaw,
      metadata,
    }) => {
      const uploadedAsset = uploadedAssetsRef.current.find(
        (item) => item.filename === filename,
      );

      if (!uploadedAsset || !isMountedRef.current) {
        return;
      }

      setUploadedAssets((current) =>
        current.map((item) =>
          item.filename === filename
            ? {
                ...item,
                transcriptionMetadata: metadata,
              }
            : item,
        ),
      );
      onTranscribeChangeAction?.(uploadedAsset, {
        transcriptionStructured,
        transcriptionRaw,
      });
    },
  });

  const hasUploadingAssets = unsavedUploads.some(
    (upload) => upload.status === "uploading",
  );

  useEffect(() => {
    onTranscribingChangeAction?.(isTranscribing);
  }, [isTranscribing, onTranscribingChangeAction]);

  useEffect(() => {
    onUploadingChangeAction?.(hasUploadingAssets);
  }, [hasUploadingAssets, onUploadingChangeAction]);

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
    const hasTranscribingAssets = shouldEnableTranscription
      ? isTranscribing
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
  }, [hasUploadingAssets, isTranscribing, shouldEnableTranscription]);

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

  const startUpload = (
    file: File,
    options?: {
      source?: "file" | "recorder";
      transcriptionMode?: "auto" | "skip";
    },
  ) => {
    const variant = getAssetVariant(file);

    if (!variant || !ALLOWED_VARIANTS.includes(variant)) {
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

    const response = await uploadAsset(upload.file).run();

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
          void startTranscription({ filename: uploadedAsset.filename });
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
    clearTranscriptionState({ filename: asset.filename });
  };

  const onTranscribeClick = async (asset: AssetItemWithPreview) => {
    if (!shouldEnableTranscription) {
      return;
    }

    await startTranscription({ filename: asset.filename });
  };

  const onCaptionChange = (asset: AssetItemWithPreview, caption: string) => {
    setUploadedAssets((current) =>
      current.map((item) =>
        item.filename === asset.filename ? { ...item, caption } : item,
      ),
    );
  };

  const shouldShowTranscribe = shouldEnableTranscription;
  const shouldShowRecorderControl =
    shouldShowRecorder &&
    ALLOWED_VARIANTS.includes("audio") &&
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
              onRecordingChangeAction={onRecordingChangeAction}
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
