"use client";

import { AssetManager } from "@/components/asset-manager";
import { AssetVariant } from "@/components/assets/asset.types";

export const LogMediaAssetInput: React.FC<{
  variant: AssetVariant;
  onFilenameChangeAction: (filename: string) => void;
  openFilePickerSignal?: number;
}> = ({ variant, onFilenameChangeAction, openFilePickerSignal }) => {
  return (
    <AssetManager
      initialUploadedAssets={[]}
      shouldEnableTranscription={false}
      shouldShowRecorder={variant === "audio"}
      allowedVariants={[variant]}
      multiple={false}
      openFilePickerSignal={openFilePickerSignal}
      onAssetsChangeAction={(assets) => {
        onFilenameChangeAction(assets[0]?.filename ?? "");
      }}
    />
  );
};
