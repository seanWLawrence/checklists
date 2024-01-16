"use server";

import { cookies } from "next/headers";
import invariant from "tiny-invariant";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { redirect } from "next/navigation";

const oneYear = 1000 * 60 * 24 * 365;
const AUTH_SECRET = process.env.AUTH_SECRET;

invariant(AUTH_SECRET, "Missing AUTH_SECRET");

// TODO improve this with CSRF token and hashing
export const login = async (formData: FormData) => {
  const username = formData.get("username");
  const password = formData.get("password");
  invariant(username, "Missing username");
  invariant(password, "Missing password");

  if (
    typeof username === "string" &&
    typeof password == "string" &&
    password === AUTH_SECRET
  ) {
    cookies().set(AUTH_COOKIE_NAME, JSON.stringify({ username, password }), {
      expires: Date.now() + oneYear,
    });

    redirect("/checklists");
  }
};

export const logout = () => {
  cookies().delete(AUTH_COOKIE_NAME);
  redirect("/login");
};

export const getUser = (): null | never | { username: string } => {
  const authCookie = cookies().get(AUTH_COOKIE_NAME);

  if (!authCookie) {
    return null;
  }

  try {
    const { username, password } = JSON.parse(authCookie.value);

    if (
      typeof username === "string" &&
      typeof password === "string" &&
      password === AUTH_SECRET
    ) {
      return { username };
    }
  } catch {
    return null;
  }

  return null;
};
