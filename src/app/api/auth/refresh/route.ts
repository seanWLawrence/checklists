import { NextRequest, NextResponse } from "next/server";

import { refreshAuthTokens } from "@/lib/auth/refresh-auth-tokens";
import { logger } from "@/lib/logger";

const getSafeRedirectToPath = (request: NextRequest): string | null => {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect");

  if (!redirect || !redirect.startsWith("/")) {
    return null;
  }

  return redirect;
};

export const GET = async (request: NextRequest) => {
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get("redirect");
  const skipRedirect = redirectParam === "false";

  const response = await refreshAuthTokens({ request })
    .map(({ status }) => {
      if (status === "tokensUnchanged") {
        if (skipRedirect) {
          return NextResponse.json(
            { ok: true, status },
            {
              status: 200,
              headers: { "Cache-Control": "no-store" },
            },
          );
        }

        return new NextResponse(null, { status: 204 });
      }

      if (skipRedirect) {
        return NextResponse.json(
          { ok: true, status },
          {
            status: 200,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      if (status === "tokensRefreshed") {
        const redirectPath = getSafeRedirectToPath(request);

        if (!redirectPath) {
          return NextResponse.redirect(new URL(request.url));
        }

        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    })
    .mapLeft((error) => {
      logger.error("Failed to refresh tokens in route", error);
      
      if (skipRedirect) {
        return NextResponse.json(
          { ok: false },
          {
            status: 401,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "failed-token-refresh");

      return NextResponse.redirect(loginUrl);
    })
    .run();

  return response.extract();
};
