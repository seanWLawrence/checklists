import {
  Codec,
  string,
  number,
  GetType,
  intersect,
  optional,
  array,
} from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";
import { Metadata } from "../../lib/types";
import { TranscriptionMetadata } from "../../lambda/worker/job.types";

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

const CREATED_AT_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidCreatedAtLocalString = (input: string): boolean => {
  if (!CREATED_AT_LOCAL_PATTERN.test(input)) {
    return false;
  }

  const [yearRaw, monthRaw, dayRaw] = input.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const asUtcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    asUtcDate.getUTCFullYear() === year &&
    asUtcDate.getUTCMonth() + 1 === month &&
    asUtcDate.getUTCDate() === day
  );
};

export const CreatedAtLocal = Codec.custom<CreatedAtLocal>({
  decode: (input) =>
    typeof input === "string" && isValidCreatedAtLocalString(input)
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
  decode: (input) => {
    if (typeof input !== "string") {
      return Left(`Invalid since '${input}'`);
    }

    const parts = input.split("to");
    if (parts.length !== 2) {
      return Left(`Invalid since '${input}'`);
    }

    const [fromRaw, toRaw] = parts;

    return CreatedAtLocal.decode(fromRaw).chain(() =>
      CreatedAtLocal.decode(toRaw).map(() => input as Since),
    );
  },
  encode: (input) => input,
});

export type Rating = 1 | 2 | 3 | 4 | 5;

export const Rating = Codec.custom<Rating>({
  decode: (input) => {
    const val = Number(input);

    return val > 0 && val < 6
      ? Right(val as Rating)
      : Left(`Invalid rating ${input}`);
  },
  encode: (input) => input,
});

export type ActivityAmount = "some" | "medium" | "aLot";

const activityAmounts = new Set<ActivityAmount>(["some", "medium", "aLot"]);

export const ActivityAmount = Codec.custom<ActivityAmount>({
  decode: (input) =>
    typeof input === "string" && activityAmounts.has(input as ActivityAmount)
      ? Right(input as ActivityAmount)
      : Left(`Invalid activity amount '${input}'`),
  encode: (input) => input,
});

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

const SentimentValence = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isFinite(val) && val >= -1 && val <= 1
      ? Right(val)
      : Left(`Invalid sentiment valence '${input}' (expected -1..1)`);
  },
  encode: (input) => input,
});

const SentimentConfidence = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isFinite(val) && val >= 0 && val <= 1
      ? Right(val)
      : Left(`Invalid sentiment confidence '${input}' (expected 0..1)`);
  },
  encode: (input) => input,
});

const JournalSentiment = Codec.interface({
  valence: SentimentValence,
  label: SentimentLabel,
  confidence: optional(SentimentConfidence),
});

type JournalSentiment = GetType<typeof JournalSentiment>;

const AnalysisUpdatedAtIso = Codec.custom<string>({
  decode: (input) => {
    if (typeof input === "string" && !Number.isNaN(new Date(input).getTime())) {
      return Right(new Date(input).toISOString());
    }
    if (input instanceof Date && !Number.isNaN(input.getTime())) {
      return Right(input.toISOString());
    }
    return Left(`Invalid analysis.updatedAt '${input}'`);
  },
  encode: (input) => input,
});

const AnalysisVersion = Codec.custom<number>({
  decode: (input) => {
    const val = Number(input);
    return Number.isInteger(val) && val > 0
      ? Right(val)
      : Left(`Invalid analysis.version '${input}'`);
  },
  encode: (input) => input,
});

export const JournalAnalysis = Codec.interface({
  dailySummary: optional(string),
  sentiment: optional(JournalSentiment),
  updatedAt: optional(AnalysisUpdatedAtIso),
  version: optional(AnalysisVersion),
});

export type JournalAnalysis = GetType<typeof JournalAnalysis>;

export const JournalAssetVariant = Codec.custom<"audio" | "image" | "video">({
  decode: (input) =>
    input === "audio" || input === "image" || input === "video"
      ? Right(input)
      : Left(`Invalid asset variant '${input}'`),
  encode: (input) => input,
});

export type JournalAssetVariant = GetType<typeof JournalAssetVariant>;

export const JournalAsset = Codec.interface({
  caption: string,
  filename: string,
  variant: JournalAssetVariant,
  fileSizeBytes: optional(number),
  transcriptionMetadata: optional(TranscriptionMetadata),
});

export type JournalAsset = GetType<typeof JournalAsset>;

export const JournalEntry = Codec.interface({
  content: optional(string),
  transcriptionRaw: optional(string),
  assets: optional(array(JournalAsset)),
});

export type JournalEntry = GetType<typeof JournalEntry>;

export const JournalRatings = Codec.interface({
  mood: optional(Rating),
  energy: optional(Rating),
  productivity: optional(Rating),
});

export type JournalRatings = GetType<typeof JournalRatings>;
export type JournalRatingKey = keyof JournalRatings;

const JournalBodyCheckIn = Codec.interface({
  goodNutrition: optional(ActivityAmount),
  cardio: optional(ActivityAmount),
  strengthTraining: optional(ActivityAmount),
  coldExposure: optional(ActivityAmount),
  stretching: optional(ActivityAmount),
  followSleepSchedule: optional(ActivityAmount),
});

type JournalBodyCheckIn = GetType<typeof JournalBodyCheckIn>;

const JournalRelationshipsCheckIn = Codec.interface({
  family: optional(ActivityAmount),
  friends: optional(ActivityAmount),
  spouse: optional(ActivityAmount),
  self: optional(ActivityAmount),
  pup: optional(ActivityAmount),
});

type JournalRelationshipsCheckIn = GetType<
  typeof JournalRelationshipsCheckIn
>;

const JournalMindCheckIn = Codec.interface({
  mindfulness: optional(ActivityAmount),
  gratitude: optional(ActivityAmount),
  breathwork: optional(ActivityAmount),
});

type JournalMindCheckIn = GetType<typeof JournalMindCheckIn>;

const JournalInterestsCheckIn = Codec.interface({
  writing: optional(ActivityAmount),
  reading: optional(ActivityAmount),
  programming: optional(ActivityAmount),
  music: optional(ActivityAmount),
  woodworking: optional(ActivityAmount),
  martialArts: optional(ActivityAmount),
  learning: optional(ActivityAmount),
  filmmaking: optional(ActivityAmount),
  philosophy: optional(ActivityAmount),
});

type JournalInterestsCheckIn = GetType<typeof JournalInterestsCheckIn>;

const JournalVicesCheckIn = Codec.interface({
  scrolling: optional(ActivityAmount),
  junkFood: optional(ActivityAmount),
  procrastination: optional(ActivityAmount),
  avoidance: optional(ActivityAmount),
  gossip: optional(ActivityAmount),
  negativity: optional(ActivityAmount),
  multitasking: optional(ActivityAmount),
  workLate: optional(ActivityAmount),
});

type JournalVicesCheckIn = GetType<typeof JournalVicesCheckIn>;

export const JournalCheckIn = Codec.interface({
  ratings: optional(JournalRatings),
  body: optional(JournalBodyCheckIn),
  relationships: optional(JournalRelationshipsCheckIn),
  mind: optional(JournalMindCheckIn),
  interests: optional(JournalInterestsCheckIn),
  vices: optional(JournalVicesCheckIn),
});

export type JournalCheckIn = GetType<typeof JournalCheckIn>;

const JournalSchemaVersion = Codec.custom<2>({
  decode: (input) => (Number(input) === 2 ? Right(2) : Left("Invalid schemaVersion")),
  encode: (input) => input,
});

const JournalBase = Codec.interface({
  schemaVersion: JournalSchemaVersion,
  createdAtLocal: CreatedAtLocal,
  entry: JournalEntry,
  checkIn: JournalCheckIn,
  analysis: optional(JournalAnalysis),
});

type JournalBase = GetType<typeof JournalBase>;

export const Journal = intersect(Metadata, JournalBase);

export type Journal = GetType<typeof Journal>;

export type JournalRatingsRadarChartDataType = {
  name: string;
  average: number;
  median: number;
  mode: number;
  eightiethPercentile: number;
  twentiethPercentile: number;
  ratingType: JournalRatingKey;
  fullMark: number;
};
export type RadarChartData = JournalRatingsRadarChartDataType[];

export interface JournalRatingTypeAndValueCount {
  name: string;
  total: number;
  ratings: { rating: Rating; updatedAtIso: Date }[];
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export type TotalRatingsByTypeAndValue = Record<
  JournalRatingKey,
  JournalRatingTypeAndValueCount
>;
