import { test } from "vitest";

import { migrateJournalV1ToV2 } from "./migrate-journal-v1-to-v2.lib";

test("migrateJournalV1ToV2 maps v1 fields into the v2 structure", ({ expect }) => {
  const migrated = migrateJournalV1ToV2({
    journal: {
      id: "11111111-1111-4111-8111-111111111111",
      createdAtIso: new Date("2026-04-01T21:00:00.000Z"),
      updatedAtIso: new Date("2026-04-01T22:00:00.000Z"),
      user: { username: "sean" },
      createdAtLocal: "2026-04-01",
      content: "Solid day",
      transcriptionRaw: "raw",
      assets: [],
      moodLevel: 4,
      energyLevel: 5,
      healthLevel: undefined,
      creativityLevel: undefined,
      relationshipsLevel: undefined,
      habits: {
        strengthTraining: undefined,
        martialArts: undefined,
        cardio: true,
        mindfulness: true,
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
      },
      hobbies: {
        martialArts: undefined,
        music: undefined,
        programming: true,
        woodworking: undefined,
        writing: undefined,
        reading: undefined,
        filming: undefined,
        learning: undefined,
      },
      dailySummary: "Strong day.",
      sentiment: {
        valence: 0.7,
        label: "positive",
        confidence: 0.9,
      },
      analysisUpdatedAt: "2026-04-01T22:00:00.000Z",
      analysisVersion: 2,
    },
  });

  expect(migrated.schemaVersion).toBe(2);
  expect(migrated.entry.content).toBe("Solid day");
  expect(migrated.checkIn.ratings).toEqual({ mood: 4, energy: 5 });
  expect(migrated.checkIn.body).toEqual({ cardio: "aLot" });
  expect(migrated.checkIn.mind).toEqual({ mindfulness: "aLot" });
  expect(migrated.checkIn.interests).toEqual({ programming: "aLot" });
  expect(migrated.analysis).toEqual({
    dailySummary: "Strong day.",
    sentiment: {
      valence: 0.7,
      label: "positive",
      confidence: 0.9,
    },
    updatedAt: "2026-04-01T22:00:00.000Z",
    version: 2,
  });
});
