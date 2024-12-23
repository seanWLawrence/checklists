import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { isProduction } from "../environment";

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
