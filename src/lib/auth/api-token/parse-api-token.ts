import { Either, Left, Right } from "purify-ts";

import { ApiTokenId, API_TOKEN_PREFIX } from "./api-token.types";

export const parseBearerTokenFromAuthorizationHeader = (
  authorizationHeader: string | null,
): Either<unknown, string> => {
  if (!authorizationHeader) {
    return Left("Missing Authorization header");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return Left("Expected Authorization header with Bearer token");
  }

  return Right(token.trim());
};

export const parseApiToken = (
  token: string,
): Either<unknown, { username: string; id: ApiTokenId; secret: string }> => {
  if (!token.startsWith(API_TOKEN_PREFIX)) {
    return Left("Invalid API token prefix");
  }

  const raw = token.slice(API_TOKEN_PREFIX.length);
  const [username, idRaw, secret] = raw.split(".");

  if (!username || !idRaw || !secret) {
    return Left("Invalid API token format");
  }

  return ApiTokenId.decode(idRaw).map((id) => ({ username, id, secret }));
};
