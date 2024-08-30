import { Metadata, UUID } from "@/lib/types";
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

type ChecklistItemTimeEstimateValue = `${number}m` | `${number}h`;

export const ChecklistItemTimeEstimate =
  Codec.custom<ChecklistItemTimeEstimateValue>({
    decode: (input) =>
      typeof input === "string" && input.match(/^\d+(m|h)$/)
        ? Right(input as ChecklistItemTimeEstimateValue)
        : Left(`Invalid ChecklistItemTimeEstimateValue. Received: '${input}'`),
    encode: (input) => input, // strings have no serialization logic
  });

export type ChecklistItemTimeEstimate = GetType<
  typeof ChecklistItemTimeEstimate
>;

export const ChecklistItem = Codec.interface({
  id: UUID,
  checklistSectionId: UUID,
  name: string,
  completed: boolean,
  note: optional(string),
  timeEstimate: optional(ChecklistItemTimeEstimate),
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
