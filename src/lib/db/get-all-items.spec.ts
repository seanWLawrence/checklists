import { test, vi } from "vitest";
import { getAllItems } from "./get-all-items";
import { Left, Right } from "purify-ts/Either";
import { Key, Metadata } from "../types";
import { Codec, intersect, string } from "purify-ts";
import { id } from "@/factories/id.factory";

const decoder = intersect(
  Codec.interface({
    hello: string,
  }),
  Metadata,
);

const keys: Key[] = ["user#username#value"];

test("fails if getSingleItemFn fails any call", async ({ expect }) => {
  const getSingleItemFn = vi
    .fn()
    .mockReturnValueOnce(
      Right({
        hello: "world",
        createdAtIso: new Date(),
        updatedAtIso: new Date(),
        id: id(),
      }),
    )
    .mockResolvedValueOnce(Left("some error"));

  const result = await getAllItems({
    keys: [...keys, "user#username#value2"],
    decoder,
    getSingleItemFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("succeeds if all getItem calls succeed", async ({ expect }) => {
  const item = {
    hello: "world",
    createdAtIso: new Date(),
    updatedAtIso: new Date(),
    id: id(),
  };

  const getSingleItemFn = vi.fn().mockReturnValue(Right(item));

  const result = await getAllItems({
    keys,
    decoder,
    getSingleItemFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual([item]);
});
