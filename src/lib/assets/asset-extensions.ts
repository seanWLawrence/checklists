import { JournalAssetVariant } from "@/app/journals/journal.types";

export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
]);

export const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
  "opus",
  "flac",
  "webm",
]);

export const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v"]);

export const ALLOWED_EXTENSIONS_BY_VARIANT: Record<
  JournalAssetVariant,
  Set<string>
> = {
  image: IMAGE_EXTENSIONS,
  audio: AUDIO_EXTENSIONS,
  video: VIDEO_EXTENSIONS,
};

export const getLowercaseExtension = (filename: string): string | null => {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return null;
  }

  return filename.slice(lastDot + 1).toLowerCase();
};

export const getAssetVariantFromFilename = (
  filename: string,
): JournalAssetVariant | null => {
  const extension = getLowercaseExtension(filename);

  if (!extension) {
    return null;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return "audio";
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return "video";
  }

  return null;
};
