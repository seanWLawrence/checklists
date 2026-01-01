import "server-only";
import { deleteCookie } from "./delete-cookie";
import { ACCESS_JWT_COOKIE_NAME } from "./auth.constants";
import { logger } from "../logger";

export const revokeAccessToken = ({
  deleteCookieFn = deleteCookie,
}: {
  deleteCookieFn?: typeof deleteCookie;
}) => {
  logger.debug(`Deleting access cookie`);

  deleteCookieFn({ name: ACCESS_JWT_COOKIE_NAME });
};
