import { JournalHabits, JournalHobbies } from "../journal.types";

type JournalHabitKey = keyof JournalHabits;
type JournalHobbyKey = keyof JournalHobbies;

export const JOURNAL_HABIT_FIELDS: Array<{
  key: JournalHabitKey;
  label: string;
}> = [
  { key: "strengthTraining", label: "Strength training" },
  { key: "cardio", label: "Cardio" },
  { key: "mindfulness", label: "Mindfulness" },
  { key: "coldExposure", label: "Cold exposure" },
  { key: "stretch", label: "Stretch" },
  { key: "breathwork", label: "Breathwork" },
  { key: "followSleepSchedule", label: "Follow sleep schedule" },
];

export const JOURNAL_HOBBY_FIELDS: Array<{
  key: JournalHobbyKey;
  label: string;
}> = [
  { key: "martialArts", label: "Martial arts" },
  { key: "music", label: "Music" },
  { key: "programming", label: "Programming" },
  { key: "woodworking", label: "Woodworking" },
  { key: "writing", label: "Writing" },
  { key: "reading", label: "Reading" },
  { key: "filming", label: "Filming" },
  { key: "learning", label: "Learning" },
];

export const EMPTY_JOURNAL_HABITS: JournalHabits = {
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

export const EMPTY_JOURNAL_HOBBIES: JournalHobbies = {
  martialArts: undefined,
  music: undefined,
  programming: undefined,
  woodworking: undefined,
  writing: undefined,
  reading: undefined,
  filming: undefined,
  learning: undefined,
};

const parseBooleanLike = (value: FormDataEntryValue | null): boolean => {
  return value === "true" || value === "on" || value === "1";
};

export const getJournalHabitsAndHobbiesFromFormData = ({
  formData,
}: {
  formData: FormData;
}): {
  habits: JournalHabits;
  hobbies: JournalHobbies;
} => {
  const habits: JournalHabits = { ...EMPTY_JOURNAL_HABITS };
  const hobbies: JournalHobbies = { ...EMPTY_JOURNAL_HOBBIES };

  for (const { key } of JOURNAL_HABIT_FIELDS) {
    habits[key] = parseBooleanLike(formData.get(key));
  }

  for (const { key } of JOURNAL_HOBBY_FIELDS) {
    hobbies[key] = parseBooleanLike(formData.get(key));
  }

  return { habits, hobbies };
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

export const getJournalHobbiesWithLegacyFallback = ({
  hobbies,
  habits,
}: {
  hobbies?: JournalHobbies;
  habits?: JournalHabits;
}): JournalHobbies => {
  const resolved: JournalHobbies = {
    ...EMPTY_JOURNAL_HOBBIES,
    ...hobbies,
  };

  for (const { key } of JOURNAL_HOBBY_FIELDS) {
    if (!resolved[key] && habits?.[key as JournalHabitKey]) {
      resolved[key] = true;
    }
  }

  return resolved;
};

export const getCompletedHobbyLabels = (hobbies?: JournalHobbies): string[] => {
  if (!hobbies) {
    return [];
  }

  return JOURNAL_HOBBY_FIELDS.filter(({ key }) => hobbies[key]).map(
    ({ label }) => label,
  );
};
