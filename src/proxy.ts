import { NextRequest } from "next/server";
import { handleAuth } from "./middleware/handle-auth";
import { AUTH_SECRET } from "./lib/auth/auth.constants";
import { applySetCookie } from "./lib/auth/apply-set-cookie";

export async function proxy(request: NextRequest) {
  const authResponse = await handleAuth({ request, authSecret: AUTH_SECRET });

  applySetCookie(request, authResponse);

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|user-credential-generator).*)",
  ],
};
