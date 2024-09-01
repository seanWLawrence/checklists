import {
  Codec,
  GetType,
  array,
  boolean,
  intersect,
  optional,
  string,
} from "purify-ts";

import { Metadata, TimeEstimate, UUID } from "@/lib/types";

export const ChecklistV2Base = Codec.interface({
  name: string,
  content: string,
});

export type ChecklistV2Base = GetType<typeof ChecklistV2Base>;

export const ChecklistV2 = intersect(Metadata, ChecklistV2Base);

export type ChecklistV2 = GetType<typeof ChecklistV2>;

export const ChecklistV2StructuredItem = Codec.interface({
  id: UUID,
  name: string,
  completed: boolean,
  note: optional(string),
  timeEstimate: optional(TimeEstimate),
});

export type ChecklistV2StructuredItem = GetType<
  typeof ChecklistV2StructuredItem
>;

export const ChecklistV2StructuredSection = Codec.interface({
  id: UUID,
  name: string,
  items: array(ChecklistV2StructuredItem),
});

export type ChecklistV2StructuredSection = GetType<
  typeof ChecklistV2StructuredSection
>;

export const ChecklistV2Structured = Codec.interface({
  sections: array(ChecklistV2StructuredSection),
});

export type ChecklistV2Structured = GetType<typeof ChecklistV2Structured>;
