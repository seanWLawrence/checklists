import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isNullOrUndefined = (
  value: unknown,
): value is null | undefined => {
  const isNull = typeof value === null;
  const isUndefined = typeof value === "undefined";

  return isNull || isUndefined;
};
