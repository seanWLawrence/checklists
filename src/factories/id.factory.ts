import { UUID } from "@/lib/types";
import { v4 } from "uuid";

export const id = (): UUID => {
  return v4() as UUID;
};
