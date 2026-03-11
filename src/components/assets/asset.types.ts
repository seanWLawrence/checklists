import { TranscriptionMetadata } from "@/lambda/worker/job.types";

export type AssetVariant = "audio" | "image" | "video";

export interface AssetItem {
  caption: string;
  filename: string;
  variant: AssetVariant;
  fileSizeBytes?: number;
  transcriptionMetadata?: TranscriptionMetadata;
}

export interface AssetItemWithPreview extends AssetItem {
  previewUrl: string;
}
