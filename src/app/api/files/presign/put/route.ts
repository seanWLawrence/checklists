import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Codec, number, optional, string } from "purify-ts/Codec";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { getPresignedPutObjectUrl } from "@/lib/aws/s3/get-presigned-put-object-url";
import { id } from "@/factories/id.factory";
import { getIncomingFileKey, isSupportedFileName } from "@/app/files/lib/file-keys";

const RequestBody = Codec.interface({ filename: string, fileSizeBytes: number, contentType: optional(string) });
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const INVALID_FILENAME_PATTERN = /[\\/\u0000-\u001f\u007f]/;

export async function POST(request: NextRequest) {
  const response = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    await liftEither(verifySameOriginRequest(request));
    const user = await fromPromise(validateUserLoggedIn({ variant: "server-action", request }));
    const body = await request.json();
    const parsedBody = await liftEither(RequestBody.decode(body));
    if (!parsedBody.filename.trim() || parsedBody.filename.length > 255 || INVALID_FILENAME_PATTERN.test(parsedBody.filename)) return throwE("Invalid filename");
    if (!isSupportedFileName(parsedBody.filename)) return throwE("This file type is not supported");
    if (parsedBody.fileSizeBytes <= 0 || parsedBody.fileSizeBytes > MAX_FILE_SIZE_BYTES) return throwE("Files must be between 1 byte and 100 MB");
    const fileId = id();
    const s3Key = getIncomingFileKey({ ownerId: user.username, fileId, originalFilename: parsedBody.filename });
    const uploadUrl = await fromPromise(getPresignedPutObjectUrl({ filename: s3Key, contentType: parsedBody.contentType }));
    return { fileId, s3Key, uploadUrl };
  }).run();
  return response.isLeft()
    ? NextResponse.json({ error: String(response.extract()) }, { status: 400 })
    : NextResponse.json(response.extract());
}
