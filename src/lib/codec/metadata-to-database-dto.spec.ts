import { id } from "@/factories/id.factory";
import { Metadata } from "../types";

export const toDatabaseDto = <T extends object>(item: T & Metadata): T => {
  return {
    ...item,
    createdAtIso: item.createdAtIso.toISOString(),
    updatedAtIso: item.updatedAtIso.toISOString(),
  };
};

import { test } from "vitest";
import { user } from "@/factories/user.factory";

test("converts metadata dates into ISO strings", ({ expect }) => {
  const createdAtIso = new Date();
  const updatedAtIso = new Date();

  const metadataOnlyItem: Metadata = {
    id: id(),
    createdAtIso,
    updatedAtIso,
    user: user(),
  };

  expect(toDatabaseDto(metadataOnlyItem)).toEqual({
    ...metadataOnlyItem,
    createdAtIso: createdAtIso.toISOString(),
    updatedAtIso: updatedAtIso.toISOString(),
  });

  const fullItem: Metadata & { hello: string } = {
    id: id(),
    createdAtIso,
    updatedAtIso,
    user: user(),
    hello: "world",
  };

  expect(toDatabaseDto(fullItem)).toEqual({
    ...fullItem,
    createdAtIso: createdAtIso.toISOString(),
    updatedAtIso: updatedAtIso.toISOString(),
  });
});
