import { test, vi } from "vitest";
import { Codec, GetType, Left, Right, intersect, string } from "purify-ts";
import { getSingleItem } from "./get-single-item";
import { Key, Metadata } from "../types";
import { id } from "@/factories/id.factory";

const key: Key = "user#username#key";

const DummyBase = Codec.interface({ hello: string });

type DummyBase = GetType<typeof DummyBase>;

const Dummy = intersect(Metadata, DummyBase);

type Dummy = GetType<typeof Dummy>;

const item: Dummy = {
  id: id(),
  hello: "hello",
  createdAtIso: new Date(),
  updatedAtIso: new Date(),
  user: { username: "username" },
};

test("fails if hgetall fails", async ({ expect }) => {
  const hgetallFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await getSingleItem({
    key,
    decoder: Dummy,
    hgetallFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("returns result if succeeds", async ({ expect }) => {
  const hgetallFn = vi.fn().mockResolvedValue(
    Right({
      ...item,
      createdAtIso: item.createdAtIso.toISOString(),
      updatedAtIso: item.updatedAtIso.toISOString(),
    }),
  );

  const result = await getSingleItem({
    key,
    decoder: Dummy,
    hgetallFn,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual({
    ...item,
    createdAtIso: item.createdAtIso.toISOString(),
    updatedAtIso: item.updatedAtIso.toISOString(),
  });
});
