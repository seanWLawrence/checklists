import { NextRequest } from "next/server";
import { handleAuth } from "./middleware/handle-auth";
import { AUTH_SECRET } from "./lib/auth/auth.constants";

export async function middleware(request: NextRequest) {
  const authResult = await handleAuth({ request, authSecret: AUTH_SECRET });

  return authResult;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
