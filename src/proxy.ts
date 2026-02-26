import { NextResponse, type NextRequest } from "next/server";

import { getUser } from "@/lib/auth/get-user";
import {
  AWS_BUCKET_NAME,
  AWS_REGION,
  NODE_ENV,
} from "@/lib/env.server";

const S3_BUCKET_HOSTNAME = `${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`;
const S3_BUCKET_ORIGIN = `https://${S3_BUCKET_HOSTNAME}`;

const buildCspHeader = (nonce: string) =>
  [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' ${S3_BUCKET_ORIGIN} blob: data:`,
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

const isProtectedRoute = (pathname: string) =>
  pathname === "/" ||
  pathname === "/login" ||
  pathname.startsWith("/checklists") ||
  pathname.startsWith("/notes") ||
  pathname.startsWith("/journals") ||
  pathname.startsWith("/admin");

const withCsp = (response: NextResponse, cspHeader: string) => {
  if (NODE_ENV !== "development") {
    response.headers.set("Content-Security-Policy", cspHeader);
  }

  return response;
};

/**
 * Adds per-request nonce-based CSP for app pages and refreshes access tokens for protected routes if needed.
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const cspHeader = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);

  const url = new URL(request.url);
  const pathname = url.pathname;
  const isLoginPage = pathname === "/login";
  const isSharePage = pathname.startsWith("/checklists/share");

  const passthrough = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!isProtectedRoute(pathname)) {
    return withCsp(passthrough, cspHeader);
  }

  const userMaybe = await getUser({ request });

  const shouldPreventInifiniteLoginRedirectLoop =
    isLoginPage && url.search.includes("error=failed-token-refresh");

  if (
    userMaybe.isJust() ||
    isSharePage ||
    request.method !== "GET" ||
    shouldPreventInifiniteLoginRedirectLoop
  ) {
    return withCsp(passthrough, cspHeader);
  }

  const redirectPathname = isLoginPage ? "/checklists" : pathname;
  const nextPath = `${redirectPathname}${url.search}`;
  const redirectUrl = new URL("/api/auth/refresh", request.url);
  redirectUrl.searchParams.set("redirect", nextPath);

  return withCsp(NextResponse.redirect(redirectUrl), cspHeader);
}

export const config = {
  matcher: [
    // Match all HTML/app routes and skip Next internals, static assets, and service worker routes.
    "/((?!api|_next/static|_next/image|serwist|favicon.ico|manifest.webmanifest|apple-touch-icon.png|icons|.*\\..*).*)",
  ],
};
