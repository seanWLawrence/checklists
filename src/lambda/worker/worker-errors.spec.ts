import { test } from "vitest";

import { isTransientWorkerError, toWorkerErrorMessage } from "./worker-errors";

test("classifies transient network/rate-limit style errors", ({ expect }) => {
  expect(isTransientWorkerError(new Error("429 rate limit exceeded"))).toBe(
    true,
  );
  expect(isTransientWorkerError("Fetch failed: socket hang up")).toBe(true);
  expect(isTransientWorkerError(new Error("503 Service Unavailable"))).toBe(
    true,
  );
});

test("does not classify validation errors as transient", ({ expect }) => {
  expect(
    isTransientWorkerError(new Error("OPENAI_API_KEY missing in app secret")),
  ).toBe(false);
  expect(
    isTransientWorkerError(new Error("App secret JSON payload is invalid")),
  ).toBe(false);
});

test("normalizes unknown errors into a loggable message", ({ expect }) => {
  expect(toWorkerErrorMessage(new Error("boom"))).toBe("boom");
  expect(toWorkerErrorMessage("boom")).toBe("boom");
  expect(toWorkerErrorMessage(42)).toBe("42");
});
