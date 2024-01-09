import { put } from "@vercel/blob";

import { checklist } from "@/factories/checklist.factory";
import { IChecklist } from "@/lib/types";

export const getChecklistById = async (
  id: string,
): Promise<IChecklist | null> => {
  return new Promise((res) => res(checklist()));
};

export const createChecklist = async (checklist: IChecklist): Promise<void> => {
  const { url } = await put("articles/blob.txt", "Hello World!", {
    access: "public",
  });
};
