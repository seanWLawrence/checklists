import "server-only";
import { SignJWT } from "jose/jwt/sign";
import { nanoid } from "nanoid";
import { Maybe } from "purify-ts";

import { User } from "../types";
import { AUD, ISS, JWT_ALGORITHM } from "@/lib/env.server";

export interface GenerateJwtParams {
  user: Pick<User, "username">;
  authSecret: string;
  expirationTime: string;
  aud?: Maybe<string>;
  iss?: Maybe<string>;
}

export const generateJwt = ({
  user,
  authSecret,
  expirationTime,
  aud = AUD,
  iss = ISS,
}: GenerateJwtParams): Promise<string> => {
  const jwt = new SignJWT()
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setJti(nanoid())
    .setIssuedAt(Date.now())
    .setExpirationTime(expirationTime)
    .setSubject(user.username);

  if (aud.isJust()) {
    jwt.setAudience(aud.extract());
  }

  if (iss.isJust()) {
    jwt.setIssuer(iss.extract());
  }

  return jwt.sign(new TextEncoder().encode(authSecret));
};
