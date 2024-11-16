import { test, vi } from "vitest";
import { scan } from "./scan";
import { Key } from "../types";
import { Left, Right } from "purify-ts/Either";

const key: Key = "user#username#value";

test("fails if getClientFn fails", async ({ expect }) => {
  const getClientFn = vi.fn().mockReturnValue(Left("some error"));

  const result = await scan({ key, getClientFn });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if scan fails", async ({ expect }) => {
  const scanMock = vi.fn().mockRejectedValue("some error");
  const getClientFn = vi.fn().mockReturnValue(Right({ scan: scanMock }));

  const result = await scan({ key, getClientFn });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("some error");
});

test("fails if scan returns invalid keys", async ({ expect }) => {
  const scanMock = vi.fn().mockResolvedValue(["0", "invalid key"]);
  const getClientFn = vi.fn().mockReturnValue(Right({ scan: scanMock }));

  const result = await scan({ key, getClientFn });

  expect(result.isLeft()).toBe(true);
  expect(result.extract()).toBe("Invalid Key: 'invalid key'");
});

test("calls itself recursively until the new cursor returns 0 and returns all of the values", async ({
  expect,
}) => {
  const key1 = "user#username#value";
  const key2 = "user#username#value2";
  const key3 = "user#username#value3";

  const scanMock = vi
    .fn()
    .mockResolvedValueOnce(["1", key1])
    .mockResolvedValueOnce(["2", key2])
    .mockResolvedValueOnce(["0", key3]);

  const getClientFn = vi.fn().mockReturnValue(Right({ scan: scanMock }));

  const result = await scan({ key, getClientFn });

  expect(scanMock).toBeCalledTimes(3);
  expect(scanMock).nthCalledWith(1, "0", { match: key, type: "hash" });
  expect(scanMock).nthCalledWith(2, "1", { match: key, type: "hash" });
  expect(scanMock).nthCalledWith(3, "2", { match: key, type: "hash" });

  expect(result.isRight()).toBe(true);
  expect(result.extract()).toEqual([key1, key2, key3]);
});
