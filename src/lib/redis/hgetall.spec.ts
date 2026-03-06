import { test, vi } from "vitest";
import { Key, Metadata } from "../types";
import { Left, Right } from "purify-ts/Either";
import { hgetall } from "./hgetall";
import { Codec, GetType, intersect, string } from "purify-ts";
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

test("fails if getClientFn fails", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(Left("some error"));

  const result = await hgetall({
    key,
    decoder: Dummy,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if hgetall returns null", async ({ expect }) => {
  const getClientFn = vi
    .fn()
    .mockReturnValue(Right({ hgetall: vi.fn().mockResolvedValue(null) }));

  const result = await hgetall({
    key,
    decoder: Dummy,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
});

test("fails if hgetall throws error", async ({ expect }) => {
  const getClientFn = vi
    .fn()
    .mockReturnValue(
      Right({ hgetall: vi.fn().mockRejectedValue("some error") }),
    );

  const result = await hgetall({
    key,
    decoder: Dummy,
    getClientFn,
  });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("returns item if succeeds", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(
    Right({
      hgetall: vi.fn().mockResolvedValue({
        ...item,
        createdAtIso: item.createdAtIso.toISOString(),
        updatedAtIso: item.updatedAtIso.toISOString(),
      }),
    }),
  );

  const result = await hgetall({
    key,
    decoder: Dummy,
    getClientFn,
  });

  // expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual(item);
});
