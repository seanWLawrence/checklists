import "server-only";
import { getCookie } from "./get-cookie";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MaybeAsync } from "purify-ts";
import { NextRequest } from "next/server";
import { logger } from "../logger";

export const getRefreshCookie = ({
  request,
  getCookieFn = getCookie,
}: {
  request?: { cookies: NextRequest["cookies"] | ReadonlyRequestCookies };
  getCookieFn?: typeof getCookie;
}): MaybeAsync<RequestCookie> => {
  logger.debug("Getting refresh cookie");

  return getCookieFn({
    name: REFRESH_TOKEN_COOKIE_NAME,
    request,
  });
};
