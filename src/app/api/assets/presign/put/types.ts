import { JournalAssetVariant } from "@/app/journals/journal.types";
import { Codec, optional, string } from "purify-ts/Codec";

export const AssetsPresignPutObjectBody = Codec.interface({
  filename: string,
  contentType: optional(string),
  variant: JournalAssetVariant,
});

export const AssetsPresignPutObjectResponse = Codec.interface({
  filename: string,
  uploadUrl: string,
});
