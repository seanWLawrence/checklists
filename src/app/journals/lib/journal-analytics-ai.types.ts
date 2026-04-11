import {
  Codec,
  GetType,
  array,
  exactly,
  optional,
  string,
} from "purify-ts/Codec";

export const JournalAnalyticsPresetPlanName = exactly("summarize-period");
export type JournalAnalyticsPresetPlanName = GetType<
  typeof JournalAnalyticsPresetPlanName
>;

export const JournalAnalyticsAnswer = Codec.interface({
  answer: string,
  observations: array(string),
  caveats: array(string),
  followUps: optional(array(string)),
});

export type JournalAnalyticsAnswer = GetType<typeof JournalAnalyticsAnswer>;
