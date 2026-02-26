import "server-only";
import { ADMIN_USERNAMES } from "@/lib/env.server";

export const isAdminUsername = (username: string): boolean => {
  return ADMIN_USERNAMES.includes(username);
};
