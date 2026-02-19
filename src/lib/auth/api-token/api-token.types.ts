import {
  Codec,
  GetType,
  array,
  date,
  intersect,
  optional,
  string,
} from "purify-ts";
import { Left, Right } from "purify-ts/Either";

import { Metadata, UUID } from "@/lib/types";
import {
  API_TOKEN_SCOPES,
  type ApiTokenScope as ApiTokenScopeType,
} from "./api-token-scopes";

export const API_TOKEN_PREFIX = "pat_";
export type ApiTokenScope = ApiTokenScopeType;

export const ApiTokenScope = Codec.custom<ApiTokenScopeType>({
  decode: (input) =>
    typeof input === "string" &&
    API_TOKEN_SCOPES.includes(input as ApiTokenScopeType)
      ? Right(input as ApiTokenScopeType)
      : Left(`Invalid API token scope '${input}'`),
  encode: (input) => input,
});

const ApiTokenBase = Codec.interface({
  name: string,
  hash: string,
  scopes: array(ApiTokenScope),
  expiresAtIso: date,
  lastUsedAtIso: optional(date),
  revokedAtIso: optional(date),
});

type ApiTokenBase = GetType<typeof ApiTokenBase>;

export const ApiToken = intersect(Metadata, ApiTokenBase);

export type ApiToken = GetType<typeof ApiToken>;

export const ApiTokenId = UUID;

export type ApiTokenId = GetType<typeof ApiTokenId>;
