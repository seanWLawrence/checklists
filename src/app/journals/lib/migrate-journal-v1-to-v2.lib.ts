import {
  Codec,
  GetType,
  optional,
  boolean as booleanCodec,
  string,
  number,
  array,
  intersect,
} from "purify-ts/Codec";

import {
  CreatedAtLocal,
  Journal,
  JournalAnalysis,
  JournalAsset,
  JournalSentiment,
  type Journal as JournalV2,
} from "../journal.types";
import { Metadata } from "../../../lib/types";

const JournalHabitsV1 = Codec.interface({
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

const JournalHobbiesV1 = Codec.interface({
  martialArts: optional(booleanCodec),
  music: optional(booleanCodec),
  programming: optional(booleanCodec),
  woodworking: optional(booleanCodec),
  writing: optional(booleanCodec),
  reading: optional(booleanCodec),
  filming: optional(booleanCodec),
  learning: optional(booleanCodec),
});

const JournalV1Base = Codec.interface({
  createdAtLocal: CreatedAtLocal,
  content: optional(string),
  transcriptionRaw: optional(string),
  assets: optional(array(JournalAsset)),
  moodLevel: optional(number),
  energyLevel: optional(number),
  healthLevel: optional(number),
  creativityLevel: optional(number),
  relationshipsLevel: optional(number),
  habits: optional(JournalHabitsV1),
  hobbies: optional(JournalHobbiesV1),
  dailySummary: optional(string),
  sentiment: optional(JournalSentiment),
  analysisUpdatedAt: optional(string),
  analysisVersion: optional(number),
});

const LegacyJournal = intersect(Metadata, JournalV1Base);
type LegacyJournal = GetType<typeof LegacyJournal>;

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

const toALot = (value?: boolean): "aLot" | undefined => {
  return value ? "aLot" : undefined;
};

export const migrateJournalV1ToV2 = ({
  journal,
}: {
  journal: LegacyJournal;
}): JournalV2 => {
  const analysis = omitEmpty<JournalAnalysis>({
    dailySummary: journal.dailySummary,
    sentiment: journal.sentiment,
    updatedAt: journal.analysisUpdatedAt,
    version: journal.analysisVersion,
  });

  const migrated = {
    id: journal.id,
    createdAtIso: journal.createdAtIso.toISOString(),
    updatedAtIso: journal.updatedAtIso.toISOString(),
    user: journal.user,
    schemaVersion: 2 as const,
    createdAtLocal: journal.createdAtLocal,
    entry: {
      content: journal.content,
      transcriptionRaw: journal.transcriptionRaw,
      assets: journal.assets,
    },
    checkIn: {
      ratings: omitEmpty({
        mood: journal.moodLevel,
        energy: journal.energyLevel,
      }),
      body: omitEmpty({
        cardio: toALot(journal.habits?.cardio),
        strengthTraining: toALot(journal.habits?.strengthTraining),
        coldExposure: toALot(journal.habits?.coldExposure),
        stretching: toALot(journal.habits?.stretch),
        followSleepSchedule: toALot(journal.habits?.followSleepSchedule),
      }),
      relationships: undefined,
      mind: omitEmpty({
        mindfulness: toALot(journal.habits?.mindfulness),
        breathwork: toALot(journal.habits?.breathwork),
      }),
      interests: omitEmpty({
        writing: toALot(journal.hobbies?.writing ?? journal.habits?.writing),
        reading: toALot(journal.hobbies?.reading ?? journal.habits?.reading),
        programming: toALot(journal.hobbies?.programming),
        music: toALot(journal.hobbies?.music ?? journal.habits?.music),
        woodworking: toALot(
          journal.hobbies?.woodworking ?? journal.habits?.woodworking,
        ),
        martialArts: toALot(
          journal.hobbies?.martialArts ?? journal.habits?.martialArts,
        ),
        learning: toALot(journal.hobbies?.learning ?? journal.habits?.learning),
        filmmaking: toALot(journal.hobbies?.filming ?? journal.habits?.filming),
      }),
      vices: undefined,
    },
    analysis,
  };

  const decoded = Journal.decode(migrated);

  if (decoded.isLeft()) {
    throw new Error(String(decoded.extract()));
  }

  return decoded.caseOf({
    Left: () => {
      throw new Error("Journal v2 decode unexpectedly failed");
    },
    Right: (value) => value,
  });
};
