import { Metadata, UUID } from "@/lib/types";
import {
  Codec,
  GetType,
  Left,
  Right,
  array,
  intersect,
  number,
  string,
} from "purify-ts";
import { optional } from "purify-ts/Codec";

export type BlockVariant = "shortMarkdown" | "longMarkdown" | "asset";

const blockVariantSet = new Set<BlockVariant>([
  "shortMarkdown",
  "longMarkdown",
  "asset",
]);

const BlockVariant = Codec.custom<BlockVariant>({
  decode: (input) =>
    typeof input === "string" && blockVariantSet.has(input as BlockVariant)
      ? Right(input as BlockVariant)
      : Left(`Invalid block variant '${input}'`),
  encode: (input) => input,
});

const ShortMarkdownVariant = Codec.custom<"shortMarkdown">({
  decode: (input) =>
    input === "shortMarkdown"
      ? Right(input)
      : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const LongMarkdownVariant = Codec.custom<"longMarkdown">({
  decode: (input) =>
    input === "longMarkdown"
      ? Right(input)
      : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const AssetBlockVariant = Codec.custom<"asset">({
  decode: (input) =>
    input === "asset" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

export type AssetVariant = "audio" | "image" | "video";

export const AssetVariant = Codec.custom<AssetVariant>({
  decode: (input) =>
    input === "audio" || input === "image" || input === "video"
      ? Right(input as AssetVariant)
      : Left(`Invalid asset variant '${input}'`),
  encode: (input) => input,
});

const ShortMarkdownBlock = Codec.interface({
  variant: ShortMarkdownVariant,
  value: string,
});

export type ShortMarkdownBlock = GetType<typeof ShortMarkdownBlock>;

const LongMarkdownBlock = Codec.interface({
  variant: LongMarkdownVariant,
  value: string,
});

export type LongMarkdownBlock = GetType<typeof LongMarkdownBlock>;

const AssetBlock = Codec.interface({
  variant: AssetBlockVariant,
  assetVariant: AssetVariant,
  filename: string,
  fileSizeBytes: optional(number),
});

export type AssetBlock = GetType<typeof AssetBlock>;

export type Block = ShortMarkdownBlock | LongMarkdownBlock | AssetBlock;

const decodeBlockByVariant = (input: unknown) => {
  if (typeof input !== "object" || input === null || !("variant" in input)) {
    return Left(`Invalid block '${input}'`);
  }

  const variantEither = BlockVariant.decode(input.variant);

  if (variantEither.isLeft()) {
    return Left(variantEither.extract() as string);
  }

  const variant = variantEither.extract();

  switch (variant) {
    case "shortMarkdown":
      return ShortMarkdownBlock.decode(input);
    case "longMarkdown":
      return LongMarkdownBlock.decode(input);
    case "asset":
      return AssetBlock.decode(input);
    default:
      return Left(`Invalid block variant '${variant}'`);
  }
};

export const Block = Codec.custom<Block>({
  decode: (input) => decodeBlockByVariant(input),
  encode: (input) => input,
});

export const LogBase = Codec.interface({
  name: string,
  blocks: array(Block),
});

export type LogBase = GetType<typeof LogBase>;

export const Log = intersect(Metadata, LogBase);

export type Log = GetType<typeof Log>;

export const LogListItem = Codec.interface({
  id: UUID,
  name: string,
  updatedAtIso: string,
});

export type LogListItem = GetType<typeof LogListItem>;
