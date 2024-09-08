import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getUser } from "./lib/auth.model";

const handleAuth = async (request: NextRequest) => {
  const isLogin = request.url.includes("/login");

  const user = await getUser(request);

  if (!isLogin && user.isNothing()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
};

export async function middleware(request: NextRequest) {
  return handleAuth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)",
  ],
};
