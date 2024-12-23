import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { DOMAIN } from "../constants";
import { isProduction } from "../environment";

export const getSecureCookieParams = ({
  expires,
  isProductionFn = isProduction,
  domain = DOMAIN,
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
    domain: isProduction ? domain : undefined,
  };
};
