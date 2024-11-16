import { jwtVerify } from "jose/jwt/verify";
import { JWTPayload } from "jose";
import { EitherAsync } from "purify-ts";

import { JWT_ALGORITHM } from "./auth.constants";

export interface ValidateJwtParams {
  authSecret?: string;
  jwt: string;
}

export const validateJwt = ({
  jwt,
  authSecret,
}: ValidateJwtParams): EitherAsync<unknown, JWTPayload> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const { payload } = await jwtVerify(
        jwt,
        new TextEncoder().encode(authSecret),
        {
          algorithms: [JWT_ALGORITHM],
        },
      );

      return payload;
    } catch (e) {
      return throwE(e);
    }
  });
};
