import "server-only";
import { Codec, GetType, intersect, string } from "purify-ts/Codec";
import { Metadata, User } from "../types";

export const RefreshTokenBase = Codec.interface({
  salt: string,
  hash: string,
  user: User,
});

export const RefreshToken = intersect(RefreshTokenBase, Metadata);

export type RefreshToken = GetType<typeof RefreshToken>;
