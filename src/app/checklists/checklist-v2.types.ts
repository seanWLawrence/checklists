import {
  Codec,
  GetType,
  Left,
  Right,
  array,
  boolean,
  intersect,
  optional,
  string,
} from "purify-ts";

import { Metadata, UUID } from "@/lib/types";

export const TimeEstimate = Codec.custom<TimeEstimateValue>({
  decode: (input) =>
    typeof input === "string" && input.match(/^\d+(m|h)$/)
      ? Right(input as TimeEstimateValue)
      : Left(`Invalid TimeEstimate. Received: '${input}'`),
  encode: (input) => input, // strings have no serialization logic
});

export type TimeEstimate = GetType<typeof TimeEstimate>;

export type ChecklistContext = `@${string}`;

export const ChecklistContext = Codec.custom<ChecklistContext>({
  decode: (input) =>
    typeof input === "string" && /^@[a-z0-9][a-z0-9_-]*$/.test(input)
      ? Right(input as ChecklistContext)
      : Left(`Invalid ChecklistContext. Received: '${String(input)}'`),
  encode: (input) => input,
});

export const ChecklistViewMode = Codec.custom<
  "group-by-section" | "group-by-context" | "group-by-next-action"
>({
  decode: (input) =>
    input === "group-by-section" ||
    input === "group-by-context" ||
    input === "group-by-next-action"
      ? Right(input)
      : Left(`Invalid ChecklistViewMode. Received: '${String(input)}'`),
  encode: (input) => input,
});

export type ChecklistViewMode = GetType<typeof ChecklistViewMode>;

export const ChecklistV2Base = Codec.interface({
  name: string,
  content: string,
  viewMode: optional(ChecklistViewMode),
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
  context: optional(ChecklistContext),
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

type TimeEstimateValue = `${number}m` | `${number}h`;

export const ChecklistV2Polled = Codec.interface({
  id: UUID,
  name: string,
  content: string,
  updatedAtIso: string,
});

export type ChecklistV2Polled = GetType<typeof ChecklistV2Polled>;
