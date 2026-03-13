"use client";

import { useState } from "react";
import { logger } from "@/lib/logger";
import { uploadAsset } from "@/lib/upload-asset";
import { AssetVariant } from "@/components/assets/asset.types";

interface UploadedAsset {
  filename: string;
  assetVariant: AssetVariant;
  fileSizeBytes: number;
  previewUrl: string;
}

export const useAssetUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File): Promise<UploadedAsset | null> => {
    setIsUploading(true);
    const previewUrl = URL.createObjectURL(file);

    const result = await uploadAsset(file).run();

    setIsUploading(false);

    return result.caseOf({
      Right: ({ filename, assetVariant }) => ({
        filename,
        assetVariant,
        fileSizeBytes: file.size,
        previewUrl,
      }),
      Left: (error) => {
        URL.revokeObjectURL(previewUrl);
        logger.error("Failed to upload asset", error);
        return null;
      },
    });
  };

  return { upload, isUploading };
};
