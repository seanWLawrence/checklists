import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const getSecureCookieParams = ({
  expires,
}: {
  expires: Date;
}): Partial<ResponseCookie> => {
  return {
    expires,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  };
};
