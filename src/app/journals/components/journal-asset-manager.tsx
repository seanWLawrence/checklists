"use client";

import { AssetManager } from "@/components/asset-manager";
import { JournalAsset } from "../journal.types";

interface JournalAssetItem extends JournalAsset {
  previewUrl: string;
}

export const JournalAssetManager: React.FC<{
  name: string;
  initialUploadedAssets: JournalAssetItem[];
  onTranscribeChangeAction?: (
    uploadedAsset: JournalAssetItem,
    transcription: {
      transcriptionStructured: string;
      transcriptionRaw: string;
    },
  ) => void;
  onTranscribingChangeAction?: (isTranscribing: boolean) => void;
  onUploadingChangeAction?: (isUploading: boolean) => void;
}> = ({
  name,
  initialUploadedAssets,
  onTranscribeChangeAction,
  onTranscribingChangeAction,
  onUploadingChangeAction,
}) => {
  return (
    <AssetManager
      name={name}
      initialUploadedAssets={initialUploadedAssets}
      onTranscribeChangeAction={
        onTranscribeChangeAction
          ? (uploadedAsset, transcription) =>
              onTranscribeChangeAction(
                uploadedAsset as JournalAssetItem,
                transcription,
              )
          : undefined
      }
      shouldEnableTranscription={true}
      shouldShowRecorder={true}
      multiple={true}
      onTranscribingChangeAction={onTranscribingChangeAction}
      onUploadingChangeAction={onUploadingChangeAction}
    />
  );
};
