"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { Maybe, Nothing } from "purify-ts/Maybe";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { MaybeAsync, string } from "purify-ts";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { User } from "@/lib/types";
import { NextRequest } from "next/server";

const JWT_ALGORITHM = "HS256";

const authSecretMaybe = Maybe.fromNullable(process.env.AUTH_SECRET).ifNothing(
  () => console.error("Missing AUTH_SECRET environment variable"),
);
const issuerAndAudienceMaybe = Maybe.fromNullable(
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
);

const fifteenMinutes = 15 * 60 * 1000;

// TODO improve this with CSRF token
export const login = async (formData: FormData) => {
  await MaybeAsync(async ({ liftMaybe }) => {
    const username = await liftMaybe(
      Maybe.fromNullable(formData.get("username")).chain((username) =>
        string.decode(username).toMaybe(),
      ) as Maybe<string>,
    );

    const password = await liftMaybe(
      Maybe.fromNullable(formData.get("password")).chain((password) => {
        return string.decode(password).toMaybe() as Maybe<string>;
      }),
    );

    const authSecret = await liftMaybe(authSecretMaybe);

    if (authSecret !== password) {
      return Nothing;
    }

    const accessTokenSigner = new SignJWT()
      .setProtectedHeader({
        alg: JWT_ALGORITHM,
      })
      .setJti(nanoid())
      .setIssuedAt(Date.now())
      .setExpirationTime("15m")
      .setSubject(username);

    issuerAndAudienceMaybe.ifJust((issuer) => {
      accessTokenSigner.setIssuer(issuer);
      accessTokenSigner.setAudience(issuer);
    });

    const accessToken = await accessTokenSigner.sign(
      new TextEncoder().encode(authSecret),
    );

    cookies().set(AUTH_COOKIE_NAME, accessToken, {
      expires: new Date(Date.now() + fifteenMinutes),
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
  });
};

export const logout = () => {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect("/login");
};

const getTokenPayload = async ({
  accessToken,
  authSecret,
}: {
  authSecret: string;
  accessToken: string;
}): Promise<Maybe<JWTPayload>> => {
  try {
    const result = await jwtVerify(
      accessToken,
      new TextEncoder().encode(authSecret),
      {
        algorithms: [JWT_ALGORITHM],
      },
    );

    return Maybe.of(result.payload);
  } catch (err) {
    return Nothing;
  }
};

export const getUser = (request?: NextRequest): MaybeAsync<User> => {
  return MaybeAsync(async ({ liftMaybe, fromPromise }) => {
    const authSecret = await liftMaybe(authSecretMaybe);

    const authCookie = await liftMaybe(
      Maybe.fromNullable(
        request?.cookies.get(AUTH_COOKIE_NAME) ??
          cookies().get(AUTH_COOKIE_NAME),
      ),
    );

    const jwtPayload = await fromPromise(
      getTokenPayload({ authSecret, accessToken: authCookie.value }),
    );

    // Is URL is present (in production this is the case), check the issuer and audience also matches
    if (issuerAndAudienceMaybe.isJust()) {
      await liftMaybe(
        issuerAndAudienceMaybe.chain((x) =>
          Maybe.fromFalsy(x === jwtPayload.iss && x === jwtPayload.aud),
        ),
      );
    }

    // Hasn't been isssued more than 15 minutes ago
    if (!jwtPayload.iat || Date.now() - jwtPayload.iat > fifteenMinutes) {
      await liftMaybe(Nothing);
    }

    const user = await liftMaybe(
      User.decode({ username: jwtPayload.sub }).toMaybe(),
    );

    return user;
  });
};
