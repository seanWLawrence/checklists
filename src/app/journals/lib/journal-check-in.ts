import { Either, Left, Right } from "purify-ts/Either";

import {
  ActivityAmount,
  type ActivityAmount as ActivityAmountType,
  JournalCheckIn,
  type JournalCheckIn as JournalCheckInType,
  type JournalRatingKey,
} from "../journal.types";

const omitEmpty = <T extends Record<string, unknown>>(
  value: T,
): T | undefined => {
  const entries = Object.entries(value).filter(([, entryValue]) => {
    return entryValue !== undefined;
  });

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries) as T;
};

export const JOURNAL_RATING_FIELDS: Array<{
  formName: string;
  key: JournalRatingKey;
  label: string;
}> = [
  { formName: "ratingMood", key: "mood", label: "Mood" },
  { formName: "ratingEnergy", key: "energy", label: "Energy" },
  {
    formName: "ratingProductivity",
    key: "productivity",
    label: "Productivity",
  },
];

export const JOURNAL_ACTIVITY_GROUPS = [
  {
    key: "body",
    label: "Body",
    fields: [
      {
        formName: "bodyGoodNutrition",
        key: "goodNutrition",
        label: "Good nutrition",
      },
      { formName: "bodyCardio", key: "cardio", label: "Cardio" },
      {
        formName: "bodyStrengthTraining",
        key: "strengthTraining",
        label: "Strength training",
      },
      {
        formName: "bodyColdExposure",
        key: "coldExposure",
        label: "Cold exposure",
      },
      {
        formName: "bodyStretching",
        key: "stretching",
        label: "Stretching",
      },
      {
        formName: "bodyFollowSleepSchedule",
        key: "followSleepSchedule",
        label: "Follow sleep schedule",
      },
    ],
  },
  {
    key: "relationships",
    label: "Relationships",
    fields: [
      { formName: "relationshipsFamily", key: "family", label: "Family" },
      { formName: "relationshipsFriends", key: "friends", label: "Friends" },
      { formName: "relationshipsSpouse", key: "spouse", label: "Spouse" },
      { formName: "relationshipsSelf", key: "self", label: "Self" },
      { formName: "relationshipsPup", key: "pup", label: "Pup" },
    ],
  },
  {
    key: "mind",
    label: "Mind",
    fields: [
      {
        formName: "mindMindfulness",
        key: "mindfulness",
        label: "Mindfulness",
      },
      { formName: "mindGratitude", key: "gratitude", label: "Gratitude" },
      { formName: "mindBreathwork", key: "breathwork", label: "Breathwork" },
    ],
  },
  {
    key: "interests",
    label: "Interests",
    fields: [
      { formName: "interestsWriting", key: "writing", label: "Writing" },
      { formName: "interestsReading", key: "reading", label: "Reading" },
      {
        formName: "interestsProgramming",
        key: "programming",
        label: "Programming",
      },
      { formName: "interestsMusic", key: "music", label: "Music" },
      {
        formName: "interestsWoodworking",
        key: "woodworking",
        label: "Woodworking",
      },
      {
        formName: "interestsMartialArts",
        key: "martialArts",
        label: "Martial arts",
      },
      { formName: "interestsLearning", key: "learning", label: "Learning" },
      {
        formName: "interestsFilmmaking",
        key: "filmmaking",
        label: "Filmmaking",
      },
      {
        formName: "interestsPhilosophy",
        key: "philosophy",
        label: "Philosophy",
      },
    ],
  },
  {
    key: "vices",
    label: "Vices",
    fields: [
      { formName: "vicesScrolling", key: "scrolling", label: "Scrolling" },
      { formName: "vicesJunkFood", key: "junkFood", label: "Junk food" },
      {
        formName: "vicesProcrastination",
        key: "procrastination",
        label: "Procrastination",
      },
      { formName: "vicesAvoidance", key: "avoidance", label: "Avoidance" },
      { formName: "vicesGossip", key: "gossip", label: "Gossip" },
      { formName: "vicesNegativity", key: "negativity", label: "Negativity" },
      {
        formName: "vicesMultitasking",
        key: "multitasking",
        label: "Multitasking",
      },
      { formName: "vicesWorkLate", key: "workLate", label: "Work late" },
    ],
  },
] as const;

export const JOURNAL_ACTIVITY_AMOUNT_OPTIONS: ActivityAmountType[] = [
  "some",
  "medium",
  "aLot",
];

const getOptionalActivityAmountFromFormData = ({
  formData,
  name,
}: {
  formData: FormData;
  name: string;
}): Either<string, ActivityAmountType | undefined> => {
  const raw = formData.get(name);

  if (raw == null) {
    return Right(undefined);
  }

  if (typeof raw !== "string") {
    return Left(`'${name}' is wrong type`);
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return Right(undefined);
  }

  return ActivityAmount.decode(trimmed);
};

export const getJournalCheckInFromFormData = ({
  formData,
}: {
  formData: FormData;
}): Either<string, JournalCheckInType> => {
  const ratings: Record<string, unknown> = {};

  for (const { formName, key } of JOURNAL_RATING_FIELDS) {
    const raw = formData.get(formName);

    if (typeof raw !== "string") {
      return Left(`Missing ${formName}`);
    }

    const decoded = Number(raw.trim());

    if (!Number.isInteger(decoded) || decoded < 1 || decoded > 5) {
      return Left(`Invalid rating '${raw}' for ${formName}`);
    }

    ratings[key] = decoded;
  }

  const groups: Record<string, Record<string, unknown> | undefined> = {};

  for (const group of JOURNAL_ACTIVITY_GROUPS) {
    const nextGroup: Record<string, unknown> = {};

    for (const field of group.fields) {
      const decoded = getOptionalActivityAmountFromFormData({
        formData,
        name: field.formName,
      });

      if (decoded.isLeft()) {
        return decoded;
      }

      const value = decoded.extract();
      if (value !== undefined) {
        nextGroup[field.key] = value;
      }
    }

    groups[group.key] = omitEmpty(nextGroup);
  }

  return JournalCheckIn.decode({
    ratings: omitEmpty(ratings),
    body: groups.body,
    relationships: groups.relationships,
    mind: groups.mind,
    interests: groups.interests,
    vices: groups.vices,
  });
};

export const getJournalCheckInDisplayGroups = ({
  checkIn,
}: {
  checkIn?: JournalCheckInType;
}): Array<{
  key: string;
  label: string;
  items: Array<{ key: string; label: string; value: ActivityAmountType }>;
}> => {
  if (!checkIn) {
    return [];
  }

  return JOURNAL_ACTIVITY_GROUPS.map((group) => {
    const values = checkIn[group.key] as
      | Record<string, ActivityAmountType | undefined>
      | undefined;

    const items = group.fields.flatMap((field) => {
      const value = values?.[field.key];

      return value ? [{ key: field.key, label: field.label, value }] : [];
    });

    return {
      key: group.key,
      label: group.label,
      items,
    };
  }).filter((group) => group.items.length > 0);
};

export const getTrackedActivities = ({
  checkIn,
}: {
  checkIn?: JournalCheckInType;
}): Array<{
  key: string;
  label: string;
  groupKey: string;
  groupLabel: string;
  value: ActivityAmountType;
}> => {
  if (!checkIn) {
    return [];
  }

  return JOURNAL_ACTIVITY_GROUPS.flatMap((group) => {
    const values = checkIn[group.key] as
      | Record<string, ActivityAmountType | undefined>
      | undefined;

    return group.fields.flatMap((field) => {
      const value = values?.[field.key];

      return value
        ? [
            {
              key: `${group.key}.${field.key}`,
              label: field.label,
              groupKey: group.key,
              groupLabel: group.label,
              value,
            },
          ]
        : [];
    });
  });
};
