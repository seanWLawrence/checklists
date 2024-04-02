import { Codec, string, GetType, intersect } from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";
import { Metadata } from "@/lib/types";

export type CreatedAtLocal =
  `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export const CreatedAtLocal = Codec.custom<CreatedAtLocal>({
  decode: (input) =>
    typeof input === "string" && input.match(/^\d{4,}-\d{2,}-\d{2,}/)?.[0]
      ? Right(input as CreatedAtLocal)
      : Left(`Invalid createdAtLocal '${input}'`),
  encode: (input) => input,
});

export const JournalBase = Codec.interface({
  content: string,
  createdAtLocal: CreatedAtLocal,
});

export type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;
