import { CreatedAtLocal } from "../journal.types";

export const getTodayLocal = (): CreatedAtLocal => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return CreatedAtLocal.unsafeDecode(`${now.getFullYear()}-${month}-${day}`);
};
