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

test("POST /api/public/notes returns 401 when unauthorized", async ({
  expect,
}) => {
  vi.mocked(authorizePublicApiRequest).mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  });

  const request = new NextRequest("http://localhost:3000/api/public/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x", content: "y" }),
  });

  const response = await POST(request);

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "Unauthorized" });
});

test("POST /api/public/notes creates note with valid token auth", async ({
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
          name: "note",
          content: "content",
          createdAtIso: new Date("2026-02-19T00:00:00.000Z"),
          updatedAtIso: new Date("2026-02-19T00:00:00.000Z"),
        }),
      ),
    ),
  );

  const request = new NextRequest("http://localhost:3000/api/public/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "note", content: "content" }),
  });

  const response = await POST(request);
  const json = await response.json();

  expect(response.status).toBe(201);
  expect(json).toMatchObject({
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "note",
    content: "content",
  });
});
