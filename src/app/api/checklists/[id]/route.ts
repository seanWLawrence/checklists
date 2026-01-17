import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { UUID } from "@/lib/types";
import { getSingleItem } from "@/lib/db/get-single-item";
import { getChecklistV2Key } from "@/app/checklists/model/get-checklist-v2.model";
import { ChecklistV2 } from "@/app/checklists/checklist-v2.types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const response = await EitherAsync(async ({ fromPromise }) => {
    const id = await fromPromise(
      EitherAsync(async ({ liftEither }) => {
        const { id } = await params;

        return liftEither(UUID.decode(id));
      }),
    );

    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action", request }),
    );

    const checklist = await fromPromise(
      getSingleItem({
        key: getChecklistV2Key({ id, user }),
        decoder: ChecklistV2,
      }),
    );

    return {
      id: checklist.id,
      name: checklist.name,
      content: checklist.content,
      updatedAtIso: checklist.updatedAtIso.toISOString(),
    };
  });

  if (response.isLeft()) {
    return NextResponse.json(
      { error: String(response.extract()) },
      { status: 401 },
    );
  }

  return NextResponse.json(response.extract());
}
