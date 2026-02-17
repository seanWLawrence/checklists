import {
  Codec,
  string,
  GetType,
  intersect,
  optional,
  array,
  boolean as booleanCodec,
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

export type SentimentLabel = "negative" | "mixed" | "neutral" | "positive";

const sentimentLabels = new Set<SentimentLabel>([
  "negative",
  "mixed",
  "neutral",
  "positive",
]);

export const SentimentLabel = Codec.custom<SentimentLabel>({
  decode: (input) =>
    typeof input === "string" && sentimentLabels.has(input as SentimentLabel)
      ? Right(input as SentimentLabel)
      : Left(`Invalid sentiment label '${input}'`),
  encode: (input) => input,
});

export const SentimentValence = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isFinite(val) && val >= -1 && val <= 1
      ? Right(val)
      : Left(`Invalid sentiment valence '${input}' (expected -1..1)`);
  },
  encode: (input) => input,
});

export const SentimentConfidence = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isFinite(val) && val >= 0 && val <= 1
      ? Right(val)
      : Left(`Invalid sentiment confidence '${input}' (expected 0..1)`);
  },
  encode: (input) => input,
});

export const JournalSentiment = Codec.interface({
  valence: SentimentValence,
  label: SentimentLabel,
  confidence: optional(SentimentConfidence),
});

export type JournalSentiment = GetType<typeof JournalSentiment>;

export const JournalHabits = Codec.interface({
  strengthTraining: optional(booleanCodec),
  martialArts: optional(booleanCodec),
  cardio: optional(booleanCodec),
  mindfulness: optional(booleanCodec),
  coldExposure: optional(booleanCodec),
  stretch: optional(booleanCodec),
  breathwork: optional(booleanCodec),
  music: optional(booleanCodec),
  woodworking: optional(booleanCodec),
  writing: optional(booleanCodec),
  reading: optional(booleanCodec),
  filming: optional(booleanCodec),
  learning: optional(booleanCodec),
  followSleepSchedule: optional(booleanCodec),
});

export type JournalHabits = GetType<typeof JournalHabits>;

export const AnalysisUpdatedAtIso = Codec.custom<string>({
  decode: (input) => {
    if (typeof input === "string" && !Number.isNaN(new Date(input).getTime())) {
      return Right(new Date(input).toISOString());
    }
    if (input instanceof Date && !Number.isNaN(input.getTime())) {
      return Right(input.toISOString());
    }
    return Left(`Invalid analysisUpdatedAt '${input}'`);
  },
  encode: (input) => input,
});

export const AnalysisVersion = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isInteger(val) && val > 0
      ? Right(val)
      : Left(`Invalid analysisVersion '${input}'`);
  },
  encode: (input) => input,
});

export const JournalAnalysis = Codec.interface({
  dailySummary: optional(string),
  sentiment: optional(JournalSentiment),
  habits: optional(JournalHabits),
  analysisUpdatedAt: optional(AnalysisUpdatedAtIso),
  analysisVersion: optional(AnalysisVersion),
});

export type JournalAnalysis = GetType<typeof JournalAnalysis>;

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
  intersect(
    Codec.interface({
      content: optional(string),
      createdAtLocal: CreatedAtLocal,
      assets: optional(array(JournalAsset)),
    }),
    JournalLevels,
  ),
  JournalAnalysis,
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
