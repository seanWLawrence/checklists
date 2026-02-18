import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts";

import { authorizePublicApiRequest } from "../../../lib/authorize-public-api-request";
import { UUID } from "@/lib/types";
import { getSingleItem } from "@/lib/db/get-single-item";
import { ChecklistV2 } from "@/app/checklists/checklist-v2.types";
import { getChecklistV2Key } from "@/app/checklists/model/get-checklist-v2.model";
import { randomChars } from "@/lib/auth/random-chars";
import { secureHashSha256 } from "@/lib/auth/secure-hash-sha256";
import { ChecklistShareAccess } from "@/app/checklists/checklist-share.types";
import { createItem } from "@/lib/db/create-item";
import { getChecklistShareKey } from "@/app/checklists/model/get-checklist-share-key";
import { expire } from "@/lib/db/expire";
import { logger } from "@/lib/logger";

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const ONE_DAY_IN_SECONDS = 24 * 60 * 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authorizePublicApiRequest({
    request,
    requiredScope: "checklists:generate-share-link",
  });

  if (!auth.ok) {
    return auth.response;
  }

  const result = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const resolvedParams = await params;
    const checklistId = await liftEither(UUID.decode(resolvedParams.id));

    await fromPromise(
      getSingleItem({
        key: getChecklistV2Key({ id: checklistId, user: auth.user }),
        decoder: ChecklistV2,
      }),
    );

    const token = await liftEither(randomChars({}));
    const hash = await liftEither(secureHashSha256(token));
    const now = new Date();
    const expiresAtIso = new Date(now.getTime() + ONE_DAY_IN_MILLISECONDS);

    const shareAccess = await liftEither(
      ChecklistShareAccess.decode({
        checklistId,
        hash,
        createdAtIso: now.toISOString(),
        expiresAtIso: expiresAtIso.toISOString(),
        user: auth.user,
      }),
    );

    await fromPromise(
      createItem({
        item: shareAccess,
        getKeyFn: () => getChecklistShareKey({ hash }),
      }),
    );

    await fromPromise(
      expire({
        key: getChecklistShareKey({ hash }),
        numSecondsToExpire: ONE_DAY_IN_SECONDS,
      }),
    );

    const shareUrl = new URL("/checklists/share", request.url);
    shareUrl.searchParams.set("token", token);

    return {
      token,
      url: shareUrl.toString(),
      expiresAtIso: expiresAtIso.toISOString(),
    };
  }).run();

  if (result.isLeft()) {
    logger.error(
      "Failed to create checklist share link via public API",
      result.extract(),
    );
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 400 },
    );
  }

  return NextResponse.json(result.extract(), { status: 201 });
}
