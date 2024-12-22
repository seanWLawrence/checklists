import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { DOMAIN } from "../constants";
import { isProduction } from "../environment";

export const getSecureCookieParams = ({
  expires,
}: {
  expires: Date;
}): Partial<ResponseCookie> => {
  return {
    expires,
    secure: isProduction,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    domain: isProduction ? DOMAIN : undefined,
  };
};
