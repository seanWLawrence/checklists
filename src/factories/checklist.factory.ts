import { date } from "purify-ts/Codec";
import { fillArray } from "./fill-array.factory";
import { id } from "./id.factory";
import {
  Checklist,
  ChecklistItem,
  ChecklistSection,
} from "@/app/checklists/legacy/checklist.types";

export const checklistItem = (
  overrides?: Partial<ChecklistItem>,
): ChecklistItem => {
  return {
    id: id(),
    checklistSectionId: id(),
    name: "some checklist item name",
    note: "some checklist item note",
    completed: false,
    timeEstimate: undefined,
    ...(overrides ?? {}),
  };
};

export const checklistSection = (
  overrides?: Partial<ChecklistSection>,
): ChecklistSection => {
  const checklistSectionId = overrides?.id ?? id();

  return {
    id: checklistSectionId,
    name: "some checklist section name",
    items: fillArray({
      length: 3,
      factory: () => checklistItem({ checklistSectionId }),
    }),
    ...(overrides ?? {}),
  };
};

export const checklist = (overrides?: Partial<Checklist>): Checklist => {
  const checklistId = overrides?.id ?? id();

  return {
    id: checklistId,
    createdAtIso: date.encode(new Date()),
    updatedAtIso: date.encode(new Date()),
    user: { username: "some username" },
    name: "some name",
    sections: fillArray({
      length: 3,
      factory: () => checklistSection(),
    }),
    ...(overrides ?? {}),
  };
};
