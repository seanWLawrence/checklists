import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { getSecureCookieParams } from "./get-secure-cookie-params";

export const defaultSetCookie = async ({
  cookieName,
  value,
  options,
}: {
  cookieName: string;
  value: string;
  options: Partial<ResponseCookie>;
}): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(cookieName, value, options);
};

export const setCookie = ({
  cookieName,
  value,
  expires,
  setCookieFn = defaultSetCookie,
}: {
  cookieName: string;
  value: string;
  expires: Date;
  setCookieFn?: typeof defaultSetCookie;
}): Promise<void> => {
  return setCookieFn({
    cookieName,
    value,
    options: getSecureCookieParams({ expires }),
  });
};
