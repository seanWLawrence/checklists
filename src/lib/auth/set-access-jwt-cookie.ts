import "server-only";
import { logger } from "../logger";
import {
  ACCESS_JWT_COOKIE_NAME,
  FIFTEEN_MINUTES_IN_MILLISECONDS,
} from "@/lib/env.server";
import { setCookie } from "./set-cookie";

export const setAccessJwtCookie = ({
  jwt,
  setJwtCookieFn = setCookie,
}: {
  jwt: string;
  setJwtCookieFn?: typeof setCookie;
}): Promise<void> => {
  logger.debug("Setting access jwt cookie");

  return setJwtCookieFn({
    cookieName: ACCESS_JWT_COOKIE_NAME,
    value: jwt,
    expires: new Date(Date.now() + FIFTEEN_MINUTES_IN_MILLISECONDS),
  });
};
