import { NextRequest, NextResponse } from "next/server";
import { EitherAsync, intersect } from "purify-ts";

import { authorizePublicApiRequest } from "../lib/authorize-public-api-request";
import { scan } from "@/lib/db/scan";
import { getAllItems } from "@/lib/db/get-all-items";
import {
  ChecklistV2,
  ChecklistV2Base,
} from "@/app/checklists/checklist-v2.types";
import { createItem } from "@/lib/db/create-item";
import { getChecklistV2Key } from "@/app/checklists/model/get-checklist-v2.model";
import { metadata } from "@/lib/db/metadata.factory";
import { Metadata, Key } from "@/lib/types";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "checklists:list",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise }) => {
    const checklistsScanKey: Key = `user#${auth.user.username}#checklist-v2#*`;
    const keys = await fromPromise(scan({ key: checklistsScanKey }));
    const checklists = await fromPromise(
      getAllItems({ keys, decoder: ChecklistV2 }),
    );

    return checklists
      .sort((a, b) => b.updatedAtIso.getTime() - a.updatedAtIso.getTime())
      .map((checklist) => ({
        id: checklist.id,
        name: checklist.name,
        updatedAtIso: checklist.updatedAtIso.toISOString(),
      }));
  }).run();

  if (result.isLeft()) {
    logger.error("Failed to list checklists for public API", result.extract());
    return NextResponse.json(
      { error: "Failed to list checklists" },
      { status: 500 },
    );
  }

  return NextResponse.json({ checklists: result.extract() });
}

export async function POST(request: NextRequest) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "checklists:create",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const payload = await request.json();
    const checklistBase = await liftEither(ChecklistV2Base.decode(payload));
    const checklist = await liftEither(
      intersect(ChecklistV2Base, Metadata).decode({
        ...checklistBase,
        ...metadata(auth.user),
      }),
    );

    return fromPromise(
      createItem({
        item: checklist,
        getKeyFn: (item) => getChecklistV2Key({ id: item.id, user: item.user }),
      }),
    );
  }).run();

  if (result.isRight()) {
    const checklist = result.extract();

    return NextResponse.json(
      {
        id: checklist.id,
        name: checklist.name,
        content: checklist.content,
        createdAtIso: checklist.createdAtIso.toISOString(),
        updatedAtIso: checklist.updatedAtIso.toISOString(),
      },
      { status: 201 },
    );
  }

  logger.error("Failed to create checklist via public API", result.extract());
  return NextResponse.json(
    { error: "Failed to create checklist" },
    { status: 400 },
  );
}
