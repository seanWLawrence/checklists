import { JournalHabits } from "../journal.types";

type JournalHabitKey = keyof JournalHabits;

export const JOURNAL_HABIT_FIELDS: Array<{
  key: JournalHabitKey;
  label: string;
}> = [
  { key: "strengthTraining", label: "Strength training" },
  { key: "martialArts", label: "Martial arts" },
  { key: "cardio", label: "Cardio" },
  { key: "mindfulness", label: "Mindfulness" },
  { key: "coldExposure", label: "Cold exposure" },
  { key: "stretch", label: "Stretch" },
  { key: "breathwork", label: "Breathwork" },
  { key: "music", label: "Music" },
  { key: "woodworking", label: "Woodworking" },
  { key: "writing", label: "Writing" },
  { key: "reading", label: "Reading" },
  { key: "filming", label: "Filming" },
  { key: "learning", label: "Learning" },
  { key: "followSleepSchedule", label: "Follow sleep schedule" },
];

const EMPTY_JOURNAL_HABITS: JournalHabits = {
  strengthTraining: undefined,
  martialArts: undefined,
  cardio: undefined,
  mindfulness: undefined,
  coldExposure: undefined,
  stretch: undefined,
  breathwork: undefined,
  music: undefined,
  woodworking: undefined,
  writing: undefined,
  reading: undefined,
  filming: undefined,
  learning: undefined,
  followSleepSchedule: undefined,
};

const parseBooleanLike = (value: FormDataEntryValue | null): boolean => {
  return value === "true" || value === "on" || value === "1";
};

export const getJournalHabitsFromFormData = ({
  formData,
}: {
  formData: FormData;
}): JournalHabits => {
  const habits: JournalHabits = { ...EMPTY_JOURNAL_HABITS };

  for (const { key } of JOURNAL_HABIT_FIELDS) {
    habits[key] = parseBooleanLike(formData.get(key));
  }

  return habits;
};

export const getCompletedHabitLabels = (
  habits?: JournalHabits,
): string[] => {
  if (!habits) {
    return [];
  }

  return JOURNAL_HABIT_FIELDS.filter(({ key }) => habits[key])
    .map(({ label }) => label);
};
