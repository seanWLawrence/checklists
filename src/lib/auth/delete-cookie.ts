import "server-only";
import { cookies } from "next/headers";
import { getSecureCookieParams } from "./get-secure-cookie-params";
import { DOMAIN, isProduction } from "../env.server";

export const deleteCookie = async ({
  name,
  isProductionFn = isProduction,
  domain = DOMAIN,
}: {
  name: string;
  isProductionFn?: () => boolean;
  domain?: string;
}): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(
    name,
    "",
    getSecureCookieParams({ expires: new Date(0), domain, isProductionFn }),
  );
};
