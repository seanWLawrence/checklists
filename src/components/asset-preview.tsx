import { Audio } from "@/components/audio";
import { Image } from "@/components/image";
import { Video } from "@/components/video";
import { AssetVariant } from "@/components/assets/asset.types";

export const AssetPreview: React.FC<{
  assetVariant: AssetVariant;
  previewUrl: string;
}> = ({ assetVariant, previewUrl }) => {
  if (assetVariant === "image") return <Image src={previewUrl} alt="" />;
  if (assetVariant === "audio") return <Audio src={previewUrl} />;
  return <Video src={previewUrl} />;
};
