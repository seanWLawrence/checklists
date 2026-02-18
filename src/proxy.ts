import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth/get-user";

const S3_BUCKET_HOSTNAME = `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
const S3_BUCKET_ORIGIN = `https://${S3_BUCKET_HOSTNAME}`;

const buildCspHeader = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' ${S3_BUCKET_ORIGIN}`,
    "font-src 'self'",
    `connect-src 'self' ${S3_BUCKET_ORIGIN}`,
    "frame-src 'none'",
    "object-src 'none'",
    `media-src 'self' ${S3_BUCKET_ORIGIN} blob:`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

/**
 * Refreshes access tokens for protected routes if the user is not authenticated and has a valid refresh token.
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);

  const url = new URL(request.url);
  const isLoginPage = url.pathname === "/login";
  const isSharePage = url.pathname.startsWith("/checklists/share");
  const userMaybe = await getUser({ request });

  const shouldPreventInifiniteLoginRedirectLoop =
    isLoginPage && url.search.includes("error=failed-token-refresh");

  if (
    userMaybe.isJust() ||
    isSharePage ||
    request.method !== "GET" ||
    shouldPreventInifiniteLoginRedirectLoop
  ) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (process.env.NODE_ENV !== "development") {
      response.headers.set("Content-Security-Policy", cspHeader);
    }

    return response;
  }

  const pathname = isLoginPage ? "/checklists" : url.pathname;
  const nextPath = `${pathname}${url.search}`;
  const redirectUrl = new URL("/api/auth/refresh", request.url);
  redirectUrl.searchParams.set("redirect", nextPath);

  const response = NextResponse.redirect(redirectUrl);

  if (process.env.NODE_ENV !== "development") {
    response.headers.set("Content-Security-Policy", cspHeader);
  }

  return response;
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
