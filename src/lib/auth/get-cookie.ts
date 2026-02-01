import "server-only";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MaybeAsync } from "purify-ts/MaybeAsync";
import { cookies } from "next/headers";
import { Maybe } from "purify-ts/Maybe";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { NextRequest } from "next/server";

const getCookieFromHeaders = ({
  name,
}: {
  name: string;
}): MaybeAsync<RequestCookie> => {
  return MaybeAsync(async ({ liftMaybe }) => {
    const cookieStore = await cookies();

    const cookieMaybe = Maybe.fromNullable(cookieStore.get(name));

    return liftMaybe(cookieMaybe);
  });
};

export const getCookie = ({
  name,
  request,
  getCookieFromHeadersFn = getCookieFromHeaders,
}: {
  name: string;
  request?: { cookies: NextRequest["cookies"] | ReadonlyRequestCookies };
  getCookieFromHeadersFn?: typeof getCookieFromHeaders;
}): MaybeAsync<RequestCookie> => {
  return MaybeAsync(async ({ fromPromise }) => {
    const cookieFromRequest = request?.cookies.get(name);

    if (cookieFromRequest) {
      return cookieFromRequest;
    }

    return fromPromise(getCookieFromHeadersFn({ name }));
  });
};
