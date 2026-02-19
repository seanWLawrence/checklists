import { test, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts";
import { Right } from "purify-ts/Either";

vi.mock("../lib/authorize-public-api-request", () => ({
  authorizePublicApiRequest: vi.fn(),
}));

vi.mock("@/lib/db/create-item", () => ({
  createItem: vi.fn(),
}));

import { POST } from "./route";
import { authorizePublicApiRequest } from "../lib/authorize-public-api-request";
import { createItem } from "@/lib/db/create-item";

test("POST /api/public/checklists returns 403 when scope is forbidden", async ({
  expect,
}) => {
  vi.mocked(authorizePublicApiRequest).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  });

  const request = new NextRequest(
    "http://localhost:3000/api/public/checklists",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x", content: "y" }),
    },
  );

  const response = await POST(request);

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "Forbidden" });
});

test("POST /api/public/checklists creates checklist with valid token auth", async ({
  expect,
}) => {
  vi.mocked(authorizePublicApiRequest).mockResolvedValue({
    ok: true,
    user: { username: "sean" },
    tokenId: "token-id",
  });
  vi.mocked(createItem).mockReturnValue(
    EitherAsync(async ({ liftEither }) =>
      liftEither(
        Right({
          id: "123e4567-e89b-12d3-a456-426614174000",
          user: { username: "sean" },
          name: "checklist",
          content: "todo",
          createdAtIso: new Date("2026-02-19T00:00:00.000Z"),
          updatedAtIso: new Date("2026-02-19T00:00:00.000Z"),
        }),
      ),
    ),
  );

  const request = new NextRequest(
    "http://localhost:3000/api/public/checklists",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "checklist", content: "todo" }),
    },
  );

  const response = await POST(request);
  const json = await response.json();

  expect(response.status).toBe(201);
  expect(json).toMatchObject({
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "checklist",
    content: "todo",
  });
});
