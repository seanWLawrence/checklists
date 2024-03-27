import { type UUID as IUUID } from "crypto";
import {
  Codec,
  GetType,
  array,
  boolean,
  date,
  intersect,
  optional,
  string,
} from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";

const UUID_REG_EXP =
  /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;

const IKEY_REG_EXP = new RegExp(`^user#.*#.*`);

export const User = Codec.interface({
  username: string,
});

export type User = GetType<typeof User>;

export const UUID = Codec.custom<IUUID>({
  decode: (input) =>
    typeof input === "string" && input.match(UUID_REG_EXP)
      ? Right(input as IUUID)
      : Left(`Invalid UUID: '${input}'`),
  encode: (input) => input, // strings have no serialization logic
});

export type UUID = GetType<typeof UUID>;

export const Metadata = Codec.interface({
  id: UUID,
  createdAtIso: date,
  updatedAtIso: date,
  user: User,
});

export type Metadata = GetType<typeof Metadata>;

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

export type Key = `user#${string /* username */}#${string}`;

export const Key = Codec.custom<Key>({
  decode: (input) =>
    typeof input === "string" && input.match(IKEY_REG_EXP)
      ? Right(input as Key)
      : Left(`Invalid Key: '${input}'`),
  encode: (input) => input, // strings have no serialization logic
});
