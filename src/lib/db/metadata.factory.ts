import { date } from "purify-ts/Codec";

import { id } from "@/factories/id.factory";
import { Metadata, User } from "@/lib/types";

export const metadata = (user: User): Metadata => {
  return {
    id: id(),
    createdAtIso: date.encode(new Date()),
    updatedAtIso: date.encode(new Date()),
    user,
  };
};
