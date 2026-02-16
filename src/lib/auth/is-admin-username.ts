import "server-only";

const parseAdminUsernames = (): string[] => {
  const raw = process.env.ADMIN_USERNAMES ?? "";

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const isAdminUsername = (username: string): boolean => {
  return parseAdminUsernames().includes(username);
};
