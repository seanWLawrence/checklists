import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { deleteObject } from "@/lib/aws/s3/delete-object";
import { Either, Left, Right } from "purify-ts/Either";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    await liftEither(verifySameOriginRequest(request));

    await fromPromise(
      validateUserLoggedIn({ variant: "server-action", request }),
    );

    const { filename } = await params;

    await liftEither(
      Either.of(filename).chain((filename) =>
        filename.length > 0
          ? Right(filename)
          : Left("Filename must be a non-empty string"),
      ),
    );

    await fromPromise(deleteObject({ filename }));

    return { ok: true };
  });

  if (response.isLeft()) {
    return NextResponse.json(
      { error: String(response.extract()) },
      { status: 400 },
    );
  }

  return NextResponse.json(response.extract());
}
