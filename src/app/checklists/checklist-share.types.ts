import { Codec, GetType, date, string } from "purify-ts";
import { UUID, User } from "@/lib/types";

export const ChecklistShareAccess = Codec.interface({
  checklistId: UUID,
  hash: string,
  createdAtIso: date,
  expiresAtIso: date,
  user: User,
});

export type ChecklistShareAccess = GetType<typeof ChecklistShareAccess>;
