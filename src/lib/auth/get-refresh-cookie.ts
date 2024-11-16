import { getCookie } from "./get-cookie";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth.constants";

import type { NextRequest } from "next/server";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MaybeAsync } from "purify-ts";

export const getRefreshCookie = ({
  request,
  getCookieFn = getCookie,
}: {
  request?: { cookies: NextRequest["cookies"] };
  getCookieFn?: typeof getCookie;
}): MaybeAsync<RequestCookie> => {
  return getCookieFn({
    name: REFRESH_TOKEN_COOKIE_NAME,
    request,
  });
};
