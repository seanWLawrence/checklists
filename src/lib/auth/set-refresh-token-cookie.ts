import "server-only";
import { logger } from "../logger";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  THIRTY_DAYS_IN_MILLISECONDS,
} from "./auth.constants";
import { setCookie } from "./set-cookie";

export const setRefreshTokenCookie = ({
  token,
  setCookieFn = setCookie,
}: {
  token: string;
  setCookieFn?: typeof setCookie;
}): Promise<void> => {
  logger.debug("Setting refresh token cookie");

  return setCookieFn({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    value: token,
    expires: new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS),
  });
};
