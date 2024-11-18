import { getCookie } from "./get-cookie";
import { ACCESS_JWT_COOKIE_NAME } from "./auth.constants";

import type { NextRequest } from "next/server";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MaybeAsync } from "purify-ts";
import { logger } from "../logger";

export const getAccessCookie = ({
  request,
  getCookieFn = getCookie,
}: {
  request?: NextRequest;
  getCookieFn?: typeof getCookie;
}): MaybeAsync<RequestCookie> => {
  logger.debug("Getting access cookie");

  return getCookieFn({
    name: ACCESS_JWT_COOKIE_NAME,
    request,
  });
};
