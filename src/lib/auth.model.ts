"use server";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { redirect } from "next/navigation";
import { Maybe } from "purify-ts/Maybe";
import { User } from "./types";
import { Codec, Either, Left, Right, string } from "purify-ts";

const oneYear = 1000 * 60 * 24 * 365;
const AUTH_SECRET = process.env.AUTH_SECRET;

const Cookie = Codec.interface({ value: string });
const AuthCookieValue = Codec.interface({ username: string, password: string });
const AuthCookie = Codec.custom({
  decode: (input) => {
    if (!AUTH_SECRET) {
      return Left("Missing AUTH_SECRET");
    }

    return Cookie.decode(input)
      .chain(({ value }) =>
        Either.encase(() => JSON.parse(value)).mapLeft((err) => err.message),
      )
      .chain(AuthCookieValue.decode)
      .chain(({ username, password }) => {
        if (password === AUTH_SECRET) {
          return Right({ username });
        }

        return Left("Password invalid");
      });
  },
  encode: (input) => input,
});

// TODO improve this with CSRF token and hashing
export const login = (formData: FormData) => {
  const username = formData.get("username");
  const password = formData.get("password");

  AuthCookieValue.decode({ username, password })
    .chain(({ username, password }) => {
      if (password === AUTH_SECRET) {
        return Right({ username, password });
      }

      return Left("Password invalid");
    })
    .chain(({ username, password }) =>
      Either.encase(() => JSON.stringify({ username, password })),
    )
    .ifRight((cookieValue) => {
      cookies().set(AUTH_COOKIE_NAME, cookieValue, {
        expires: Date.now() + oneYear,
      });

      redirect("/checklists");
    });
};

export const logout = () => {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect("/login");
};

export const getUser = (): Maybe<User> => {
  return Maybe.fromNullable(cookies().get(AUTH_COOKIE_NAME)).chain((x) =>
    AuthCookie.decode(x).toMaybe(),
  );
};
