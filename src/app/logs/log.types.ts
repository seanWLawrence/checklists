import { Metadata, UUID } from "@/lib/types";
import {
  Codec,
  GetType,
  Left,
  Right,
  array,
  boolean,
  intersect,
  number,
  string,
} from "purify-ts";

export type BlockVariant =
  | "checkbox"
  | "shortText"
  | "longText"
  | "number"
  | "audio"
  | "image"
  | "video";

const blockVariantSet = new Set<BlockVariant>([
  "checkbox",
  "shortText",
  "longText",
  "number",
  "audio",
  "image",
  "video",
]);

const BlockVariant = Codec.custom<BlockVariant>({
  decode: (input) =>
    typeof input === "string" && blockVariantSet.has(input as BlockVariant)
      ? Right(input as BlockVariant)
      : Left(`Invalid block variant '${input}'`),
  encode: (input) => input,
});

const CheckboxVariant = Codec.custom<"checkbox">({
  decode: (input) =>
    input === "checkbox" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const ShortTextVariant = Codec.custom<"shortText">({
  decode: (input) =>
    input === "shortText" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const LongTextVariant = Codec.custom<"longText">({
  decode: (input) =>
    input === "longText" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const NumberVariant = Codec.custom<"number">({
  decode: (input) =>
    input === "number" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const AudioVariant = Codec.custom<"audio">({
  decode: (input) =>
    input === "audio" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const ImageVariant = Codec.custom<"image">({
  decode: (input) =>
    input === "image" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const VideoVariant = Codec.custom<"video">({
  decode: (input) =>
    input === "video" ? Right(input) : Left(`Invalid variant '${input}'`),
  encode: (input) => input,
});

const CheckboxBlock = Codec.interface({
  name: string,
  variant: CheckboxVariant,
  value: boolean,
});

export type CheckboxBlock = GetType<typeof CheckboxBlock>;

const ShortTextBlock = Codec.interface({
  name: string,
  variant: ShortTextVariant,
  value: string,
});

export type ShortTextBlock = GetType<typeof ShortTextBlock>;

const LongTextBlock = Codec.interface({
  name: string,
  variant: LongTextVariant,
  value: string,
});

export type LongTextBlock = GetType<typeof LongTextBlock>;

const NumberBlock = Codec.interface({
  name: string,
  variant: NumberVariant,
  value: number,
});

export type NumberBlock = GetType<typeof NumberBlock>;

const AudioBlock = Codec.interface({
  name: string,
  variant: AudioVariant,
  value: string,
});

export type AudioBlock = GetType<typeof AudioBlock>;

const ImageBlock = Codec.interface({
  name: string,
  variant: ImageVariant,
  value: string,
});

export type ImageBlock = GetType<typeof ImageBlock>;

const VideoBlock = Codec.interface({
  name: string,
  variant: VideoVariant,
  value: string,
});

export type VideoBlock = GetType<typeof VideoBlock>;

export type Block =
  | CheckboxBlock
  | ShortTextBlock
  | LongTextBlock
  | NumberBlock
  | AudioBlock
  | ImageBlock
  | VideoBlock;

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
    case "checkbox":
      return CheckboxBlock.decode(input);
    case "shortText":
      return ShortTextBlock.decode(input);
    case "longText":
      return LongTextBlock.decode(input);
    case "number":
      return NumberBlock.decode(input);
    case "audio":
      return AudioBlock.decode(input);
    case "image":
      return ImageBlock.decode(input);
    case "video":
      return VideoBlock.decode(input);
    default:
      return Left(`Invalid block variant '${variant}'`);
  }
};

export const Block = Codec.custom<Block>({
  decode: (input) => decodeBlockByVariant(input),
  encode: (input) => input,
});

export const LogSection = Codec.interface({
  name: string,
  blocks: array(Block),
});

export type LogSection = GetType<typeof LogSection>;

const LogBase = Codec.interface({
  name: string,
  sections: array(LogSection),
});

type LogBase = GetType<typeof LogBase>;

export const Log = intersect(Metadata, LogBase);

export type Log = GetType<typeof Log>;

export const LogListItem = Codec.interface({
  id: UUID,
  name: string,
  updatedAtIso: string,
});

export type LogListItem = GetType<typeof LogListItem>;
