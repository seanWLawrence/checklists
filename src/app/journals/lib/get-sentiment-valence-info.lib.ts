export type SentimentValenceBucket =
  | "veryPositive"
  | "positive"
  | "mixed"
  | "negative"
  | "veryNegative";

export const SENTIMENT_VALENCE_BUCKET_LABELS: Record<
  SentimentValenceBucket,
  string
> = {
  veryPositive: "Very positive",
  positive: "Positive",
  mixed: "Mixed / neutral",
  negative: "Negative",
  veryNegative: "Very negative",
};

export const getSentimentValenceInfo = (
  valence: number,
): {
  bucket: SentimentValenceBucket;
  label: string;
  className: string;
  title: string;
} => {
  if (valence >= 0.6) {
    return {
      bucket: "veryPositive",
      label: SENTIMENT_VALENCE_BUCKET_LABELS.veryPositive,
      className: "text-emerald-700 dark:text-emerald-400",
      title: `Very positive sentiment (${valence.toFixed(2)})`,
    };
  }

  if (valence >= 0.2) {
    return {
      bucket: "positive",
      label: SENTIMENT_VALENCE_BUCKET_LABELS.positive,
      className: "text-green-700 dark:text-green-400",
      title: `Positive sentiment (${valence.toFixed(2)})`,
    };
  }

  if (valence > -0.2) {
    return {
      bucket: "mixed",
      label: SENTIMENT_VALENCE_BUCKET_LABELS.mixed,
      className: "text-zinc-700 dark:text-zinc-300",
      title: `Mixed / neutral sentiment (${valence.toFixed(2)})`,
    };
  }

  if (valence > -0.6) {
    return {
      bucket: "negative",
      label: SENTIMENT_VALENCE_BUCKET_LABELS.negative,
      className: "text-amber-700 dark:text-amber-400",
      title: `Negative sentiment (${valence.toFixed(2)})`,
    };
  }

  return {
    bucket: "veryNegative",
    label: SENTIMENT_VALENCE_BUCKET_LABELS.veryNegative,
    className: "text-rose-700 dark:text-rose-400",
    title: `Very negative sentiment (${valence.toFixed(2)})`,
  };
};
