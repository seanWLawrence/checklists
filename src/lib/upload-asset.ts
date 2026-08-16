import { EitherAsync } from "purify-ts/EitherAsync";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "@/app/api/assets/presign/put/types";
import { AssetVariant } from "@/components/assets/asset.types";

export const getAssetVariant = (file: File): AssetVariant | null => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return null;
};

export const uploadAsset = (
  file: File,
): EitherAsync<unknown, { filename: string; assetVariant: AssetVariant }> => {
  return EitherAsync(async ({ liftEither, throwE }) => {
    const assetVariant = getAssetVariant(file);

    if (!assetVariant) {
      return throwE(`Unsupported file type: ${file.type}`);
    }

    const body = await liftEither(
      AssetsPresignPutObjectBody.decode({
        filename: file.name,
        contentType: file.type,
        variant: assetVariant,
      }).map((decoded) => JSON.stringify(decoded)),
    );

    const presignResponse = await fetch("/api/assets/presign/put", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!presignResponse.ok) {
      return throwE("Failed to get upload URL");
    }

    const { uploadUrl, filename } = await liftEither(
      AssetsPresignPutObjectResponse.decode(await presignResponse.json()),
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    });

    if (!uploadResponse.ok) {
      return throwE("Failed to upload file");
    }

    return { filename, assetVariant };
  });
};
