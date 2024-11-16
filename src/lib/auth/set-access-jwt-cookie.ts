import {
  ACCESS_JWT_COOKIE_NAME,
  FIFTEEN_MINUTES_IN_MILLISECONDS,
} from "./auth.constants";
import { setCookie } from "./set-cookie";

export const setAccessJwtCookie = ({
  jwt,
  setJwtCookieFn = setCookie,
}: {
  jwt: string;
  setJwtCookieFn?: typeof setCookie;
}): void => {
  setJwtCookieFn({
    cookieName: ACCESS_JWT_COOKIE_NAME,
    value: jwt,
    expires: new Date(Date.now() + FIFTEEN_MINUTES_IN_MILLISECONDS),
  });
};
