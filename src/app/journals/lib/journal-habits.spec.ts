import { test } from "vitest";

import {
  getJournalCheckInDisplayGroups,
  getJournalCheckInFromFormData,
  getTrackedActivities,
} from "./journal-habits";

test("getJournalCheckInFromFormData assembles ratings and grouped activities", ({
  expect,
}) => {
  const formData = new FormData();
  formData.set("ratingMood", "4");
  formData.set("ratingEnergy", "3");
  formData.set("ratingProductivity", "5");
  formData.set("bodyStrengthTraining", "aLot");
  formData.set("mindGratitude", "medium");
  formData.set("interestsProgramming", "some");
  formData.set("vicesScrolling", "");

  const result = getJournalCheckInFromFormData({ formData });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    ratings: {
      mood: 4,
      energy: 3,
      productivity: 5,
    },
    body: {
      strengthTraining: "aLot",
    },
    mind: {
      gratitude: "medium",
    },
    interests: {
      programming: "some",
    },
  });
});

test("display helpers only return tracked activities", ({ expect }) => {
  const checkIn = {
    ratings: { mood: 4, energy: 4, productivity: 4 },
    body: { cardio: "some" as const },
    relationships: undefined,
    mind: undefined,
    interests: { reading: "aLot" as const },
    vices: undefined,
  } as never;

  expect(getJournalCheckInDisplayGroups({ checkIn })).toEqual([
    {
      key: "body",
      label: "Body",
      items: [{ key: "cardio", label: "Cardio", value: "some" }],
    },
    {
      key: "interests",
      label: "Interests",
      items: [{ key: "reading", label: "Reading", value: "aLot" }],
    },
  ]);

  expect(getTrackedActivities({ checkIn })).toEqual([
    {
      key: "body.cardio",
      label: "Cardio",
      groupKey: "body",
      groupLabel: "Body",
      value: "some",
    },
    {
      key: "interests.reading",
      label: "Reading",
      groupKey: "interests",
      groupLabel: "Interests",
      value: "aLot",
    },
  ]);
});
