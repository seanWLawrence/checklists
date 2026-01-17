import { Key } from "@/lib/types";

export const getChecklistShareKey = ({ hash }: { hash: string }): Key =>
  `shareChecklistToken#${hash}`;
