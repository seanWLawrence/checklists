import "server-only";

import { Either, Left, Right } from "purify-ts/Either";
import { NextRequest } from "next/server";

const SAFE_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

/**
 * CSRF guard for cookie-authenticated browser requests.
 *
 * Strategy:
 * - If Origin is present, require exact origin match.
 * - If Sec-Fetch-Site is present, reject explicit cross-site requests.
 * - If neither header exists (non-browser clients), allow and rely on auth.
 */
export const verifySameOriginRequest = (
  request: NextRequest,
): Either<string, true> => {
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;

  if (origin && origin !== expectedOrigin) {
    return Left("Invalid origin");
  }

  const secFetchSite = request.headers.get("sec-fetch-site");

  if (secFetchSite && !SAFE_FETCH_SITES.has(secFetchSite)) {
    return Left("Cross-site requests are not allowed");
  }

  return Right(true);
};
