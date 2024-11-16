import { Metadata } from "../types";

export const metadataToDatabaseDto = <T extends object>(
  item: T & Metadata,
): T &
  Omit<Metadata, "createdAtIso" | "updatedAtIso"> & {
    createdAtIso: string;
    updatedAtIso: string;
  } => {
  return {
    ...item,
    createdAtIso: item.createdAtIso.toISOString(),
    updatedAtIso: item.updatedAtIso.toISOString(),
  };
};
