import { User } from "@/lib/types";

export const user = (overrides?: Partial<User>) => ({
  username: "some username",
  ...overrides,
});
