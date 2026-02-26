import "server-only";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProduction } from "../env.server";

export const getSecureCookieParams = ({
  expires,
  isProductionFn = isProduction,
}: {
  expires: Date;
  isProductionFn?: typeof isProduction;
  domain?: string;
}): Partial<ResponseCookie> => {
  const isProduction = isProductionFn();

  return {
    expires,
    secure: isProduction,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  };
};
