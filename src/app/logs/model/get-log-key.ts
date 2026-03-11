import { Key, UUID, User } from "@/lib/types";

export const getLogKey = ({
  user,
  id,
}: {
  user: User;
  id: UUID;
}): Key => `user#${user.username}#log#${id}`;
