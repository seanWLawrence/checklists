import { NextRequest, NextResponse } from "next/server";

import { refreshAuthTokens } from "@/lib/auth/refresh-auth-tokens";

const getSafeRedirectToPath = (request: NextRequest): string | null => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo");

  if (!redirectTo || !redirectTo.startsWith("/")) {
    return null;
  }

  return redirectTo;
};

export const GET = async (request: NextRequest) => {
  const response = await refreshAuthTokens({ request })
    .map(({ status }) => {
      if (status === "tokensUnchanged") {
        return new NextResponse(null, { status: 204 });
      }

      if (status === "tokensRefreshed") {
        const redirectToPath = getSafeRedirectToPath(request);

        if (!redirectToPath) {
          return NextResponse.redirect(new URL(request.url));
        }

        return NextResponse.redirect(new URL(redirectToPath, request.url));
      }
    })
    .mapLeft(() => {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "failed-token-refresh");

      return NextResponse.redirect(loginUrl);
    })
    .run();

  return response.extract();
};
