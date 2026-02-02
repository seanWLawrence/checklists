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

const dateToCreatedAtLocal = (date: Date): CreatedAtLocal => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}` as CreatedAtLocal;
};

export const CreatedAtLocal = Codec.custom<CreatedAtLocal>({
  decode: (input) =>
    typeof input === "string" && input.match(/^\d{4,}-\d{2,}-\d{2,}$/)?.[0]
      ? Right(input as CreatedAtLocal)
      : input instanceof Date && !Number.isNaN(input.getTime())
        ? Right(dateToCreatedAtLocal(input))
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

export const JournalAssetVariant = Codec.custom<"audio" | "image">({
  decode: (input) =>
    input === "audio" || input === "image"
      ? Right(input)
      : Left(`Invalid asset variant '${input}'`),
  encode: (input) => input,
});

export type JournalAssetVariant = GetType<typeof JournalAssetVariant>;

export const JournalAsset = Codec.interface({
  caption: string,
  filename: string,
  variant: JournalAssetVariant,
});

export type JournalAsset = GetType<typeof JournalAsset>;

export const JournalBase = intersect(
  Codec.interface({
    content: string,
    createdAtLocal: CreatedAtLocal,
    assets: optional(array(JournalAsset)),
  }),
  JournalLevels,
);

export type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;

// TODO build this feature out
// type ExperienceCategory =
//   | "fun"
//   | "funny"
//   | "sad"
//   | "challenging"
//   | "pivotal"
//   | "peaceful";
//
// const experienceCategories = new Set<ExperienceCategory>([
//   "fun",
//   "funny",
//   "sad",
//   "challenging",
//   "pivotal",
//   "peaceful",
// ]);
//
// const ExperienceCategory = Codec.custom({
//   decode: (input) => {
//     return typeof input === "string" &&
//       experienceCategories.has(input as ExperienceCategory)
//       ? Right(input)
//       : Left(`Invalid ExperienceCategory: '${input}'`);
//   },
//   encode: (input) => input,
// });
//
// const ExperienceBase = Codec.interface({
//   name: string,
//   approximateDate: optional(CreatedAtLocal),
//   categories: array(ExperienceCategory),
//   content: string,
// });
//
// type ExperienceBase = GetType<typeof ExperienceBase>;
//
// const Experience = intersect(Metadata, ExperienceBase);
//
// type Experience = GetType<typeof Experience>;

export type JournalLevelsRadarChartDataType = {
  name: string;
  average: number;
  median: number;
  mode: number;
  eightiethPercentile: number;
  twentiethPercentile: number;
  levelType: keyof JournalLevels;
  fullMark: number;
};
export type RadarChartData = JournalLevelsRadarChartDataType[];

export interface JournalLevelTypeAndValueCount {
  /**
   * @example Energy
   */
  name: string;
  total: number;
  levels: { level: Level; updatedAtIso: Date }[];
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export type TotalLevelsByTypeAndValue = Record<
  keyof JournalLevels,
  JournalLevelTypeAndValueCount
>;
