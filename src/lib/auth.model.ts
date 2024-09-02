"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { Maybe, Nothing } from "purify-ts/Maybe";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { MaybeAsync } from "purify-ts";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { User } from "@/lib/types";

const JWT_ALGORITHM = "HS256";

const authSecretMaybe = Maybe.fromNullable(process.env.AUTH_SECRET).ifNothing(
  () => console.error("Missing AUTH_SECRET environment variable"),
);

const fifteenMinutes = 15 * 60 * 1000;

// TODO improve this with CSRF token
export const login = async (formData: FormData) => {
  const username = formData.get("username");
  const password = formData.get("password");

  authSecretMaybe.ifJust(async (authSecret) => {
    if (authSecret !== password) {
      return Nothing;
    }

    const accessToken = await new SignJWT({ username })
      .setProtectedHeader({
        alg: JWT_ALGORITHM,
      })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(authSecret));

    cookies().set(AUTH_COOKIE_NAME, accessToken, {
      expires: new Date(Date.now() + fifteenMinutes),
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      domain: Maybe.fromNullable(
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
      ).extract(),
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

export const getUser = (): MaybeAsync<User> => {
  return MaybeAsync(async ({ liftMaybe, fromPromise }) => {
    const authSecret = await liftMaybe(authSecretMaybe);
    const authCookie = await liftMaybe(
      Maybe.fromNullable(cookies().get(AUTH_COOKIE_NAME)),
    );

    const jwtPayload = await fromPromise(
      getTokenPayload({ authSecret, accessToken: authCookie.value }),
    );

    const user = await liftMaybe(User.decode(jwtPayload).toMaybe());

    return user;
  });
};
