import { Key } from "@/lib/types";

export const getLogKey = ({
  username,
  id,
}: {
  username: string;
  id: string;
}): Key => `user#${username}#log#${id}`;
