import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts";

import { authorizePublicApiRequest } from "../../lib/authorize-public-api-request";
import { UUID } from "@/lib/types";
import { getSingleItem } from "@/lib/db/get-single-item";
import { ChecklistV2 } from "@/app/checklists/checklist-v2.types";
import { getChecklistV2Key } from "@/app/checklists/model/get-checklist-v2.model";
import { updateItem } from "@/lib/db/update-item";
import { logger } from "@/lib/logger";

const parseChecklistPatchPayload = (
  payload: unknown,
): { name?: string; content?: string } | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const name = candidate.name;
  const content = candidate.content;

  if (
    (name !== undefined && typeof name !== "string") ||
    (content !== undefined && typeof content !== "string")
  ) {
    return null;
  }

  if (name === undefined && content === undefined) {
    return null;
  }

  return { name, content };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "checklists:read",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const resolvedParams = await params;
    const id = await liftEither(UUID.decode(resolvedParams.id));

    const checklist = await fromPromise(
      getSingleItem({
        key: getChecklistV2Key({ id, user: auth.user }),
        decoder: ChecklistV2,
      }),
    );

    return {
      id: checklist.id,
      name: checklist.name,
      content: checklist.content,
      createdAtIso: checklist.createdAtIso.toISOString(),
      updatedAtIso: checklist.updatedAtIso.toISOString(),
    };
  }).run();

  if (result.isLeft()) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  return NextResponse.json(result.extract());
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "checklists:update",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(
    async ({ fromPromise, liftEither, throwE }) => {
      const resolvedParams = await params;
      const id = await liftEither(UUID.decode(resolvedParams.id));
      const payload = parseChecklistPatchPayload(await request.json());

      if (!payload) {
        return throwE("Invalid payload");
      }

      const existing = await fromPromise(
        getSingleItem({
          key: getChecklistV2Key({ id, user: auth.user }),
          decoder: ChecklistV2,
        }),
      );

      const updated = await liftEither(
        ChecklistV2.decode({
          ...existing,
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.content !== undefined
            ? { content: payload.content }
            : {}),
          createdAtIso: existing.createdAtIso.toISOString(),
          updatedAtIso: new Date().toISOString(),
        }),
      );

      return fromPromise(
        updateItem({
          item: updated,
          getKeyFn: (item) =>
            getChecklistV2Key({ id: item.id, user: item.user }),
        }),
      );
    },
  ).run();

  if (result.isRight()) {
    const checklist = result.extract();

    return NextResponse.json({
      id: checklist.id,
      name: checklist.name,
      content: checklist.content,
      updatedAtIso: checklist.updatedAtIso.toISOString(),
    });
  }

  logger.error("Failed to update checklist via public API", result.extract());
  return NextResponse.json(
    { error: "Failed to update checklist" },
    { status: 400 },
  );
}
