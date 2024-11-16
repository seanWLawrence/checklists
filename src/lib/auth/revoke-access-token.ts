import { deleteCookie } from "./delete-cookie";
import { ACCESS_JWT_COOKIE_NAME } from "./auth.constants";

export const revokeAccessToken = ({
  deleteCookieFn = deleteCookie,
}: {
  deleteCookieFn?: typeof deleteCookie;
}) => {
  deleteCookieFn({ name: ACCESS_JWT_COOKIE_NAME });
};
