import { type UUID as IUUID } from "crypto";
import { Codec, GetType, date, string } from "purify-ts/Codec";
import { Left, Right } from "purify-ts/Either";

const UUID_REG_EXP =
  /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;

const IKEY_REG_EXP = /(^user#.*#.*|^refreshToken#.*)/;

export const User = Codec.interface({
  username: string,
});

export type User = GetType<typeof User>;

export const UserCredentials = Codec.interface({
  passwordHash: string,
  salt: string,
});

export type UserCredentials = GetType<typeof UserCredentials>;

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

export type Key =
  | `user#${string /* username */}#${string}`
  | `refreshToken#${string}`;

export const Key = Codec.custom<Key>({
  decode: (input) =>
    typeof input === "string" && input.match(IKEY_REG_EXP)
      ? Right(input as Key)
      : Left(`Invalid Key: '${input}'`),
  encode: (input) => input, // strings have no serialization logic
});

type TimeEstimateValue = `${number}m` | `${number}h`;

export const TimeEstimate = Codec.custom<TimeEstimateValue>({
  decode: (input) =>
    typeof input === "string" && input.match(/^\d+(m|h)$/)
      ? Right(input as TimeEstimateValue)
      : Left(`Invalid TimeEstimate. Received: '${input}'`),
  encode: (input) => input, // strings have no serialization logic
});

export type TimeEstimate = GetType<typeof TimeEstimate>;
