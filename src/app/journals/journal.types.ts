import { Codec, string, GetType, intersect, optional } from "purify-ts/Codec";
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

export type Level = 1 | 2 | 3 | 4 | 5;

export const Level = Codec.custom<Level>({
  decode: (input) => {
    const val = Number(input);

    return val > 0 && val < 6
      ? Right(input as Level)
      : Left(`Invalid level ${input}`);
  },
  encode: (input) => input,
});

export const JournalBase = Codec.interface({
  content: string,
  createdAtLocal: CreatedAtLocal,
  energyLevel: optional(Level),
  moodLevel: optional(Level),
  healthLevel: optional(Level),
  creativityLevel: optional(Level),
  relationshipsLevel: optional(Level),
});

export type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;
