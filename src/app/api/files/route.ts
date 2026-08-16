import { NextRequest, NextResponse } from "next/server";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Codec, boolean, number, optional, string } from "purify-ts/Codec";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { verifySameOriginRequest } from "@/lib/security/verify-same-origin-request";
import { putItem } from "@/lib/aws/dynamodb/put-item";
import { getFilePartitionKey, getFileSortKey } from "@/app/files/lib/file-records";
import { getIncomingFileKey } from "@/app/files/lib/file-keys";
import { FileRecord } from "@/app/files/file.types";
import { objectExists } from "@/lib/aws/s3/object-exists";
import { queueJob } from "@/lambda/worker/queueJob";
import { updateItem } from "@/lib/aws/dynamodb/update-item";
import { id } from "@/factories/id.factory";

const RequestBody = Codec.interface({ fileId: string, filename: string, fileSizeBytes: number, contentType: optional(string), keepContentOutOfAi: boolean });

export async function POST(request: NextRequest) {
  const response = await EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    await liftEither(verifySameOriginRequest(request));
    const user = await fromPromise(validateUserLoggedIn({ variant: "server-action", request }));
    const body = await request.json();
    const parsedBody = await liftEither(RequestBody.decode(body));
    const s3Key = getIncomingFileKey({ ownerId: user.username, fileId: parsedBody.fileId, originalFilename: parsedBody.filename });
    if (!s3Key.includes(`/_incoming/${parsedBody.fileId}/`)) return throwE("Invalid file ID");
    const uploaded = await fromPromise(objectExists({ key: s3Key }));
    if (!uploaded) return throwE("Upload was not found");
    const now = new Date().toISOString();
    const file = await liftEither(FileRecord.decode({
      id: parsedBody.fileId,
      ownerId: user.username,
      originalFilename: parsedBody.filename,
      contentType: parsedBody.contentType,
      fileSizeBytes: parsedBody.fileSizeBytes,
      s3Key,
      status: parsedBody.keepContentOutOfAi ? "needs-review" : "uploaded",
      keepContentOutOfAi: parsedBody.keepContentOutOfAi,
      entities: [],
      tags: [],
      createdAtIso: now,
      updatedAtIso: now,
    }));
    await fromPromise(putItem({ item: { pk: getFilePartitionKey(user.username), sk: getFileSortKey(file.id), ...file }, conditionExpression: "attribute_not_exists(pk)" }));
    if (!file.keepContentOutOfAi) {
      const queueResult = await queueJob({
        username: user.username,
        jobId: id(),
        jobType: "fileClassification",
        input: { fileId: file.id },
      }).run();
      if (queueResult.isLeft()) {
        await fromPromise(updateItem({
          pk: getFilePartitionKey(user.username), sk: getFileSortKey(file.id),
          updateExpression: "SET #status = :status, #updatedAtIso = :updatedAtIso",
          attributeNames: { "#status": "status", "#updatedAtIso": "updatedAtIso" },
          attributeValues: { ":status": "failed", ":updatedAtIso": new Date().toISOString() },
        }));
        return throwE("Failed to queue file processing");
      }
    }
    return file;
  }).run();
  return response.isLeft() ? NextResponse.json({ error: String(response.extract()) }, { status: 400 }) : NextResponse.json(response.extract(), { status: 201 });
}
