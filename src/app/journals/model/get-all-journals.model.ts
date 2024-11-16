import { Key, User } from "@/lib/types";

export const getAllJournalsScanKey = ({ user }: { user: User }): Key =>
  `user#${user.username}#journal#*`;
