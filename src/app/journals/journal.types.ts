import {
  Codec,
  string,
  GetType,
  intersect,
  optional,
  array,
} from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";
import { Metadata } from "@/lib/types";

/**
 * YYYY-MM-DD
 */
export type CreatedAtLocal =
  `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

export const CreatedAtLocal = Codec.custom<CreatedAtLocal>({
  decode: (input) =>
    typeof input === "string" && input.match(/^\d{4,}-\d{2,}-\d{2,}$/)?.[0]
      ? Right(input as CreatedAtLocal)
      : Left(`Invalid createdAtLocal '${input}'`),
  encode: (input) => input,
});

/**
 * YYYY-MM-DDtoYYYY-MM-DD
 */
export type Since = `${CreatedAtLocal}to${CreatedAtLocal}`;

export const Since = Codec.custom<Since>({
  decode: (input) =>
    typeof input === "string" &&
    input.match(/^\d{4,}-\d{2,}-\d{2,}to\d{4,}-\d{2,}-\d{2,}$/)?.[0]
      ? Right(input as Since)
      : Left(`Invalid since '${input}'`),
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

export const JournalLevels = Codec.interface({
  energyLevel: optional(Level),
  moodLevel: optional(Level),
  healthLevel: optional(Level),
  creativityLevel: optional(Level),
  relationshipsLevel: optional(Level),
});

export type JournalLevels = GetType<typeof JournalLevels>;

export const JournalBase = intersect(
  Codec.interface({
    content: string,
    createdAtLocal: CreatedAtLocal,
  }),
  JournalLevels,
);

export type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;

export type ExperienceCategory =
  | "fun"
  | "funny"
  | "sad"
  | "challenging"
  | "pivotal"
  | "peaceful";

const experienceCategories = new Set<ExperienceCategory>([
  "fun",
  "funny",
  "sad",
  "challenging",
  "pivotal",
  "peaceful",
]);

export const ExperienceCategory = Codec.custom({
  decode: (input) => {
    return typeof input === "string" &&
      experienceCategories.has(input as ExperienceCategory)
      ? Right(input)
      : Left(`Invalid ExperienceCategory: '${input}'`);
  },
  encode: (input) => input,
});

export const ExperienceBase = Codec.interface({
  name: string,
  approximateDate: optional(CreatedAtLocal),
  categories: array(ExperienceCategory),
  content: string,
});

export type ExperienceBase = GetType<typeof ExperienceBase>;

export const Experience = intersect(Metadata, ExperienceBase);

export type Experience = GetType<typeof Experience>;
