import { Metadata, TimeEstimate, UUID } from "@/lib/types";
import {
  Codec,
  GetType,
  array,
  boolean,
  intersect,
  optional,
  string,
} from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";

export const ChecklistItem = Codec.interface({
  id: UUID,
  checklistSectionId: UUID,
  name: string,
  completed: boolean,
  note: optional(string),
  timeEstimate: optional(TimeEstimate),
});

export type ChecklistItem = GetType<typeof ChecklistItem>;

export const ChecklistSection = Codec.interface({
  id: UUID,
  name: string,
  items: array(ChecklistItem),
});

export type ChecklistSection = GetType<typeof ChecklistSection>;

export const ChecklistBase = Codec.interface({
  name: string,
  sections: array(ChecklistSection),
});

export type ChecklistBase = GetType<typeof ChecklistBase>;

export const Checklist = intersect(Metadata, ChecklistBase);

export type Checklist = GetType<typeof Checklist>;
