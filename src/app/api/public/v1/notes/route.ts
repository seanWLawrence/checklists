import { NextRequest, NextResponse } from "next/server";
import { EitherAsync, intersect } from "purify-ts";

import { authorizePublicApiRequest } from "../lib/authorize-public-api-request";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import { Note, NoteBase } from "@/app/notes/types";
import { createItem } from "@/lib/db/create-item";
import { getNoteKey } from "@/app/notes/model/get-note.model";
import { metadata } from "@/lib/db/metadata.factory";
import { Metadata, Key } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "notes:list",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise }) => {
    const notesScanKey: Key = `user#${auth.user.username}#note#*`;
    const keys = await fromPromise(scan({ key: notesScanKey }));
    const notes = await fromPromise(getAllItems({ keys, decoder: Note }));

    return notes
      .sort((a, b) => b.updatedAtIso.getTime() - a.updatedAtIso.getTime())
      .map((note) => ({
        id: note.id,
        name: note.name,
        updatedAtIso: note.updatedAtIso.toISOString(),
      }));
  }).run();

  if (result.isLeft()) {
    logger.error("Failed to list notes for public API", result.extract());
    return NextResponse.json(
      { error: "Failed to list notes" },
      { status: 500 },
    );
  }

  return NextResponse.json({ notes: result.extract() });
}

export async function POST(request: NextRequest) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "notes:create",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const payload = await request.json();
    const noteBase = await liftEither(NoteBase.decode(payload));
    const note = await liftEither(
      intersect(NoteBase, Metadata).decode({
        ...noteBase,
        ...metadata(auth.user),
      }),
    );

    return fromPromise(
      createItem({
        item: note,
        getKeyFn: (item) => getNoteKey({ id: item.id, user: item.user }),
      }),
    );
  }).run();

  if (result.isRight()) {
    const note = result.extract();

    return NextResponse.json(
      {
        id: note.id,
        name: note.name,
        content: note.content,
        createdAtIso: note.createdAtIso.toISOString(),
        updatedAtIso: note.updatedAtIso.toISOString(),
      },
      { status: 201 },
    );
  }

  logger.error("Failed to create note via public API", result.extract());
  return NextResponse.json({ error: "Failed to create note" }, { status: 400 });
}
