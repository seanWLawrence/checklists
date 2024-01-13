import { fillArray } from "./fill-array.factory";
import { id } from "./id.factory";
import { IChecklist, IChecklistItem, IChecklistSection } from "@/lib/types";

export const checklistItem = (
  overrides?: Partial<IChecklistItem>,
): IChecklistItem => {
  return {
    id: id(),
    checklistSectionId: id(),
    name: "some checklist item name",
    note: "some checklist item note",
    completed: false,
    ...(overrides ?? {}),
  };
};

export const checklistSection = (
  overrides?: Partial<IChecklistSection>,
): IChecklistSection => {
  const checklistSectionId = overrides?.id ?? id();

  return {
    id: checklistSectionId,
    checklistId: id(),
    name: "some checklist section name",
    items: fillArray({
      length: 3,
      factory: () => checklistItem({ checklistSectionId }),
    }),
    ...(overrides ?? {}),
  };
};

export const checklist = (overrides?: Partial<IChecklist>): IChecklist => {
  const checklistId = overrides?.id ?? id();

  return {
    id: checklistId,
    name: "some name",
    sections: fillArray({
      length: 3,
      factory: () => checklistSection({ checklistId }),
    }),
    ...(overrides ?? {}),
  };
};
