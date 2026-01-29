import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getObject } from "@/lib/aws/s3/get-object";
import { transcribeJournalAudioIntoContent } from "@/app/journals/lib/transcribe-audio-into-content.lib";
import { Either, Left, Right } from "purify-ts/Either";

const INVALID_FILENAME_PATTERN = /[\/\\\u0000-\u001f\u007f]/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    await fromPromise(
      validateUserLoggedIn({ variant: "server-action", request }),
    );

    const { filename } = await params;

    await liftEither(
      Either.of(filename)
        .chain((filename) =>
          filename.length > 0
            ? Right(filename)
            : Left("Filename must be a non-empty string"),
        )
        .chain((filename) =>
          INVALID_FILENAME_PATTERN.test(filename)
            ? Left("Filename contains invalid characters")
            : Right(filename),
        )
        .chain((filename) =>
          filename.length > 255
            ? Left("Filename must be 255 characters or fewer")
            : Right(filename),
        ),
    );

    const { body, contentType } = await fromPromise(getObject({ filename }));
    const audio = new File([Buffer.from(body)], filename, {
      type: contentType ?? "audio/mpeg",
    });

    const text = await fromPromise(
      transcribeJournalAudioIntoContent({ audio }),
    );

    return { text };
  });

  if (response.isLeft()) {
    return NextResponse.json(
      { error: String(response.extract()) },
      { status: 400 },
    );
  }

  return NextResponse.json(response.extract());
}
