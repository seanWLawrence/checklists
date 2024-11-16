import { getCookie } from "./get-cookie";
import { ACCESS_JWT_COOKIE_NAME } from "./auth.constants";

import type { NextRequest } from "next/server";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MaybeAsync } from "purify-ts";

export const getAccessCookie = ({
  request,
  getCookieFn = getCookie,
}: {
  request?: NextRequest;
  getCookieFn?: typeof getCookie;
}): MaybeAsync<RequestCookie> => {
  return getCookieFn({
    name: ACCESS_JWT_COOKIE_NAME,
    request,
  });
};
