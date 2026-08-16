import { FileCategory } from "../file.types";

const safeSegment = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

const SUPPORTED_EXTENSIONS = new Set([
  "pdf", "jpg", "jpeg", "png", "gif", "webp", "heic", "mp3", "wav",
  "m4a", "aac", "ogg", "flac", "docx", "epub", "txt",
]);

const getFileExtension = (filename: string): string => {
  const extension = filename.split(".").pop();
  return extension && extension !== filename ? safeSegment(extension) : "bin";
};

export const isSupportedFileName = (filename: string): boolean =>
  SUPPORTED_EXTENSIONS.has(getFileExtension(filename));

export const getIncomingFileKey = ({ ownerId, fileId, originalFilename }: { ownerId: string; fileId: string; originalFilename: string }) =>
  `files/${safeSegment(ownerId)}/_incoming/${fileId}/${safeSegment(originalFilename.replace(/\.[^.]+$/, "")) || "upload"}.${getFileExtension(originalFilename)}`;

export const getOrganizedFileKey = ({ ownerId, fileId, category, kind, primaryDate, entity, originalFilename }: {
  ownerId: string; fileId: string; category: FileCategory; kind: string; primaryDate?: string; entity?: string; originalFilename: string;
}) => {
  const safeKind = safeSegment(kind) || "document";
  const dateOrYear = primaryDate?.match(/^\d{4}(-\d{2}-\d{2})?$/)?.[0] ?? "undated";
  const year = dateOrYear.slice(0, 4) === "unda" ? "undated" : dateOrYear.slice(0, 4);
  const filenameParts = [dateOrYear, safeKind, safeSegment(entity ?? "") || undefined, fileId].filter(Boolean);
  return `files/${safeSegment(ownerId)}/documents/${category}/${year}/${safeKind}/${filenameParts.join("--")}.${getFileExtension(originalFilename)}`;
};
