import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getChecklistV2ByShareToken } from "@/app/checklists/model/get-checklist-v2-by-share-token.model";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.json({ error: "Missing share token" }, { status: 400 });
  }

  const response = await EitherAsync(async ({ fromPromise }) => {
    const checklist = await fromPromise(getChecklistV2ByShareToken({ token }));

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
      { status: 400 },
    );
  }

  return NextResponse.json(response.extract());
}
