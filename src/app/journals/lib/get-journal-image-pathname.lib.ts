import { CreatedAtLocal } from "../journal.types";
import { getJournalImagePrefix } from "./get-journal-image-prefix.lib";

const sanitizeFilename = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, "-");
  return safe.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};

const getExtension = (filename: string, fallback = "jpg"): string => {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop() : undefined;
  return ext && ext.length <= 8 ? ext.toLowerCase() : fallback;
};

const buildImageFilename = ({
  description,
  originalName,
}: {
  description: string;
  originalName: string;
}): string => {
  const ext = getExtension(originalName);
  const base = description ? sanitizeFilename(description) : "";

  if (base.length > 0) {
    return `${base.slice(0, 60)}.${ext}`;
  }

  return originalName;
};

export const getJournalImagePathname = ({
  createdAtLocal,
  description,
  originalName,
}: {
  createdAtLocal: CreatedAtLocal;
  description: string;
  originalName: string;
}): string => {
  const imageName = buildImageFilename({ description, originalName });
  return `${getJournalImagePrefix({ createdAtLocal })}${imageName}`;
};
