import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts";

import { authorizePublicApiRequest } from "../../lib/authorize-public-api-request";
import { UUID } from "@/lib/types";
import { getSingleItem } from "@/lib/db/get-single-item";
import { Note } from "@/app/notes/types";
import { getNoteKey } from "@/app/notes/model/get-note.model";
import { updateItem } from "@/lib/db/update-item";
import { logger } from "@/lib/logger";

const parseNotePatchPayload = (
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
    requiredScope: "notes:read",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const resolvedParams = await params;
    const id = await liftEither(UUID.decode(resolvedParams.id));

    const note = await fromPromise(
      getSingleItem({
        key: getNoteKey({ id, user: auth.user }),
        decoder: Note,
      }),
    );

    return {
      id: note.id,
      name: note.name,
      content: note.content,
      createdAtIso: note.createdAtIso.toISOString(),
      updatedAtIso: note.updatedAtIso.toISOString(),
    };
  }).run();

  if (result.isLeft()) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(result.extract());
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "notes:update",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(
    async ({ fromPromise, liftEither, throwE }) => {
      const resolvedParams = await params;
      const id = await liftEither(UUID.decode(resolvedParams.id));
      const payload = parseNotePatchPayload(await request.json());

      if (!payload) {
        return throwE("Invalid payload");
      }

      const existing = await fromPromise(
        getSingleItem({
          key: getNoteKey({ id, user: auth.user }),
          decoder: Note,
        }),
      );

      const updated = await liftEither(
        Note.decode({
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
          getKeyFn: (item) => getNoteKey({ id: item.id, user: item.user }),
        }),
      );
    },
  ).run();

  if (result.isRight()) {
    const note = result.extract();

    return NextResponse.json({
      id: note.id,
      name: note.name,
      content: note.content,
      updatedAtIso: note.updatedAtIso.toISOString(),
    });
  }

  logger.error("Failed to update note via public API", result.extract());
  return NextResponse.json({ error: "Failed to update note" }, { status: 400 });
}
