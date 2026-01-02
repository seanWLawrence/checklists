import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth/get-user";

/**
 * Refreshes access tokens for protected routes if the user is not authenticated and has a valid refresh token.
 */
export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const isLoginPage = url.pathname === "/login";
  const userMaybe = await getUser({ request });

  const shouldPreventInifiniteLoginRedirectLoop =
    isLoginPage && url.search.includes("error=failed-token-refresh");

  if (
    userMaybe.isJust() ||
    request.method !== "GET" ||
    shouldPreventInifiniteLoginRedirectLoop
  ) {
    return NextResponse.next();
  }

  const pathname = isLoginPage ? "/checklists" : url.pathname;
  const nextPath = `${pathname}${url.search}`;
  const redirectUrl = new URL("/api/auth/refresh", request.url);
  redirectUrl.searchParams.set("redirectTo", nextPath);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/checklists/:path*",
    "/notes/:path*",
    "/journals/:path*",
    "/",
    "/login",
  ],
};
