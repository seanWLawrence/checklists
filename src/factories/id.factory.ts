import { UUID } from "@/lib/types";

export const id = (): UUID => {
  return crypto.randomUUID() as UUID;
};
