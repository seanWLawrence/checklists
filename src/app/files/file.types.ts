import { Codec, GetType, array, boolean, number, optional, string } from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";
import { UUID } from "@/lib/types";

export const FILE_CATEGORIES = [
  "financial", "taxes", "work", "health", "insurance", "home", "identity",
  "education", "books", "music", "photos", "other",
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number];
type FileStatus = "uploaded" | "processing" | "ready" | "needs-review" | "failed";

const enumCodec = <T extends string>(values: readonly T[], label: string) =>
  Codec.custom<T>({
    decode: (input) =>
      typeof input === "string" && values.includes(input as T)
        ? Right(input as T)
        : Left(`Invalid ${label}: '${String(input)}'`),
    encode: (input) => input,
  });

export const FileCategory = enumCodec(FILE_CATEGORIES, "file category");
const FileStatus = enumCodec<FileStatus>(
  ["uploaded", "processing", "ready", "needs-review", "failed"],
  "file status",
);

export const FileRecord = Codec.interface({
  id: UUID,
  ownerId: string,
  originalFilename: string,
  contentType: optional(string),
  fileSizeBytes: number,
  s3Key: string,
  status: FileStatus,
  keepContentOutOfAi: boolean,
  topLevelCategory: optional(FileCategory),
  kind: optional(string),
  title: optional(string),
  primaryDate: optional(string),
  entities: array(string),
  tags: array(string),
  summary: optional(string),
  classificationConfidence: optional(number),
  createdAtIso: string,
  updatedAtIso: string,
});

export type FileRecord = GetType<typeof FileRecord>;
