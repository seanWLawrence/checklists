"use client";

import { AssetManager } from "@/components/asset-manager";
import { AssetItemWithPreview, AssetVariant } from "@/components/assets/asset.types";

export const LogMediaAssetInput: React.FC<{
  variant: AssetVariant;
  label: string;
  onFilenameChangeAction: (filename: string) => void;
  initialUploadedAssets?: AssetItemWithPreview[];
}> = ({
  variant,
  label,
  onFilenameChangeAction,
  initialUploadedAssets = [],
}) => {
  return (
    <AssetManager
      initialUploadedAssets={initialUploadedAssets.map((asset) => ({
        ...asset,
        caption: label,
      }))}
      shouldEnableTranscription={false}
      shouldShowRecorder={variant === "audio"}
      shouldShowRecorderTranscribeOption={false}
      shouldShowCaptionField={false}
      shouldHideAddFilesWhenHasAssets={true}
      allowedVariants={[variant]}
      multiple={false}
      onAssetsChangeAction={(assets) => {
        onFilenameChangeAction(assets[0]?.filename ?? "");
      }}
    />
  );
};
