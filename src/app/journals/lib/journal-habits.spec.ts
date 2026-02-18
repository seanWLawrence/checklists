import { test } from "vitest";
import {
  getCompletedHabitLabels,
  getCompletedHobbyLabels,
  getJournalHabitsAndHobbiesFromFormData,
  getJournalHobbiesWithLegacyFallback,
} from "./journal-habits";

test("getJournalHabitsAndHobbiesFromFormData splits daily habits and hobbies", ({
  expect,
}) => {
  const formData = new FormData();
  formData.set("strengthTraining", "true");
  formData.set("followSleepSchedule", "on");
  formData.set("music", "1");
  formData.set("programming", "true");

  const { habits, hobbies } = getJournalHabitsAndHobbiesFromFormData({
    formData,
  });

  expect(habits.strengthTraining).toBe(true);
  expect(habits.followSleepSchedule).toBe(true);
  expect(habits.music).toBe(undefined);
  expect(hobbies.music).toBe(true);
  expect(hobbies.programming).toBe(true);
  expect(hobbies.reading).toBe(false);
});

test("getJournalHobbiesWithLegacyFallback reads hobby flags from legacy habits", ({
  expect,
}) => {
  const resolved = getJournalHobbiesWithLegacyFallback({
    hobbies: undefined,
    habits: {
      strengthTraining: true,
      martialArts: false,
      cardio: false,
      mindfulness: false,
      coldExposure: false,
      stretch: false,
      breathwork: false,
      music: true,
      woodworking: false,
      writing: false,
      reading: true,
      filming: false,
      learning: false,
      followSleepSchedule: false,
    },
  });

  expect(resolved.music).toBe(true);
  expect(resolved.reading).toBe(true);
  expect(resolved.writing).toBe(undefined);
});

test("completed label helpers return selected labels only", ({ expect }) => {
  const habits = {
    strengthTraining: true,
    martialArts: undefined,
    cardio: false,
    mindfulness: false,
    coldExposure: false,
    stretch: false,
    breathwork: false,
    music: undefined,
    woodworking: undefined,
    writing: undefined,
    reading: undefined,
    filming: undefined,
    learning: undefined,
    followSleepSchedule: true,
  };
  const hobbies = {
    martialArts: true,
    music: false,
    programming: true,
    woodworking: false,
    writing: false,
    reading: true,
    filming: false,
    learning: false,
  };

  expect(getCompletedHabitLabels(habits)).toEqual([
    "Strength training",
    "Follow sleep schedule",
  ]);
  expect(getCompletedHobbyLabels(hobbies)).toEqual([
    "Martial arts",
    "Programming",
    "Reading",
  ]);
});
