import { test } from "vitest";
import { user } from "@/factories/user.factory";
import { id } from "@/factories/id.factory";
import { metadataToDatabaseDto } from "./metadata-to-database-dto";
import { Metadata } from "../types";

test("converts metadata dates into ISO strings", ({ expect }) => {
  const createdAtIso = new Date();
  const updatedAtIso = new Date();

  const metadataOnlyItem: Metadata = {
    id: id(),
    createdAtIso,
    updatedAtIso,
    user: user(),
  };

  expect(metadataToDatabaseDto(metadataOnlyItem)).toEqual({
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

  expect(metadataToDatabaseDto(fullItem)).toEqual({
    ...fullItem,
    createdAtIso: createdAtIso.toISOString(),
    updatedAtIso: updatedAtIso.toISOString(),
  });
});
