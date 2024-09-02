import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getUser } from "./lib/auth.model";

const handleAuth = async (request: NextRequest) => {
  const isLogin = request.url.includes("/login");

  if (isLogin) {
    return NextResponse.next();
  }

  const user = await getUser();

  if (user.isJust()) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
};

export async function middleware(request: NextRequest) {
  await handleAuth(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
