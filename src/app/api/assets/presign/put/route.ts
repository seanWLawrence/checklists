import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { getAssetFilename } from "@/lib/aws/s3/get-asset-filename";
import { getPresignedPutObjectUrl } from "@/lib/aws/s3/get-presigned-put-object-url";
import { JournalAssetVariant } from "@/app/journals/journal.types";
import { Either, Left, Right } from "purify-ts/Either";
import {
  AssetsPresignPutObjectBody,
  AssetsPresignPutObjectResponse,
} from "./types";

const INVALID_FILENAME_PATTERN = /[\/\\\u0000-\u001f\u007f]/;
const ALLOWED_EXTENSIONS: Record<JournalAssetVariant, Set<string>> = {
  image: new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "heif"]),
  audio: new Set(["mp3", "m4a", "aac", "wav", "ogg", "opus", "flac", "webm"]),
};

const getLowercaseExtension = (filename: string): string | null => {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === filename.length - 1) {
    return null;
  }

  return filename.slice(lastDot + 1).toLowerCase();
};

export async function POST(request: NextRequest) {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    await liftEither(verifySameOriginRequest(request));

    await fromPromise(
      validateUserLoggedIn({ variant: "server-action", request }),
    );

    const body = await fromPromise(
      EitherAsync(async ({ liftEither, throwE }) => {
        try {
          const response = await request.json();

          return liftEither(AssetsPresignPutObjectBody.decode(response));
        } catch (error) {
          return throwE(error);
        }
      }),
    );

    const filename = await liftEither(
      Either.of(body.filename)
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
        )
        .chain((filename) => {
          const extension = getLowercaseExtension(filename);
          if (!extension) {
            return Left("Filename must include an extension");
          }

          const allowedExtensions = ALLOWED_EXTENSIONS[body.variant];
          return allowedExtensions.has(extension)
            ? Right(filename)
            : Left(`File extension '.${extension}' is not allowed`);
        })
        .map((filename) => getAssetFilename(filename)),
    );

    const contentType = await liftEither(
      Either.of(body.contentType).chain((contentType) => {
        if (!contentType) {
          return Right(contentType);
        }

        const expectedPrefix = `${body.variant}/`;
        return contentType.startsWith(expectedPrefix)
          ? Right(contentType)
          : Left(`Content type must start with '${expectedPrefix}'`);
      }),
    );

    const uploadUrl = await fromPromise(
      getPresignedPutObjectUrl({
        filename,
        contentType,
      }),
    );

    return liftEither(
      AssetsPresignPutObjectResponse.decode({
        filename,
        uploadUrl,
      }),
    );
  });

  if (response.isLeft()) {
    return NextResponse.json(
      { error: String(response.extract()) },
      { status: 400 },
    );
  }

  return NextResponse.json(response.extract());
}
