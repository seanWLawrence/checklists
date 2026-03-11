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
}> = ({ name, initialUploadedAssets, onTranscribeChangeAction }) => {
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
      allowedVariants={["audio", "image", "video"]}
      multiple={true}
    />
  );
};
