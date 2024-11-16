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
}) => {
  setCookieFn({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    value: token,
    expires: new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS),
  });
};
