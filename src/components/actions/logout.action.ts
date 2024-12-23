"use server";

import { logout } from "@/lib/auth/logout";

export const logoutAction = async () => {
  await logout({});
};
