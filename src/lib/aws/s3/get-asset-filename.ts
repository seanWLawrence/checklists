import { generateAssetId } from "./generate-asset-id";

export const getAssetFilename = (originalFilename: string): string => {
  const extension = originalFilename.includes(".")
    ? "." + originalFilename.split(".").pop()
    : "";

  return `${generateAssetId()}${extension}`;
};
