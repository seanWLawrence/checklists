import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  const authCookieContainsSecret =
    authCookie?.value &&
    JSON.parse(authCookie.value)?.password === process.env.AUTH_SECRET;

  const isLogin = request.url.includes("/login");

  if (authCookieContainsSecret || isLogin) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
