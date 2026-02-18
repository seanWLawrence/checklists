import { Codec, GetType, array, date, intersect, optional, string } from "purify-ts";
import { Left, Right } from "purify-ts/Either";

import { Metadata, UUID } from "@/lib/types";

export const API_TOKEN_PREFIX = "slpat_";

const apiTokenScopes = [
  "notes:create",
  "notes:read",
  "notes:list",
  "notes:update",
  "checklists:create",
  "checklists:read",
  "checklists:list",
  "checklists:update",
  "checklists:generate-share-link",
] as const;

export type ApiTokenScope = (typeof apiTokenScopes)[number];

export const ApiTokenScope = Codec.custom<ApiTokenScope>({
  decode: (input) =>
    typeof input === "string" &&
    apiTokenScopes.includes(input as ApiTokenScope)
      ? Right(input as ApiTokenScope)
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
