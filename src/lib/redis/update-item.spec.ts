import { vi, test } from "vitest";
import { Left, Right } from "purify-ts/Either";

import { updateItem } from "./update-item";
import { Key, Metadata } from "../types";
import { id } from "@/factories/id.factory";
import { Codec, GetType, intersect, string } from "purify-ts";

const getKeyFn = (): Key => "user#username#key";

const DummyBase = Codec.interface({
  hello: string,
});

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

test("fails if hmsetFn fails", async ({ expect }) => {
  const hmsetFn = vi.fn().mockResolvedValue(Left("some error"));

  const result = await updateItem({
    hmsetFn,
    getKeyFn,
    item,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("succeeds if nothing fails", async ({ expect }) => {
  const hmsetFn = vi.fn().mockResolvedValue(Right(void 0));

  const result = await updateItem({
    hmsetFn,
    getKeyFn,
    item,
  });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toMatchObject({
    ...item,
    updatedAtIso: expect.any(Date),
  });
});
