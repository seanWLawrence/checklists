import { EitherAsync } from "purify-ts/EitherAsync";
import { getItem } from "@/lib/aws/dynamodb/get-item";
import { getObject } from "@/lib/aws/s3/get-object";
import { moveObject } from "@/lib/aws/s3/move-object";
import { FileRecord } from "@/app/files/file.types";
import { getFilePartitionKey, getFileSortKey } from "@/app/files/lib/file-record-keys";
import { getOrganizedFileKey } from "@/app/files/lib/file-keys";
import { FileClassificationJobInput, JobHandler, SucceededJob } from "../../job.types";
import { workerDynamoDbClient, workerS3Client } from "../../aws-clients";
import { workerEnv } from "../../env";
import { updateJob } from "../../updateJob";
import { classifyFile } from "./classify-file";
import { extractNativeContent } from "./extract-native-content";
import { markFileNeedsReview, markFileProcessing, markFileReady } from "./update-file-record";

export const handler: JobHandler<FileClassificationJobInput> = ({ message, jobInput }) =>
  EitherAsync(async ({ fromPromise, throwE }) => {
    const file = await fromPromise(getItem({
      pk: getFilePartitionKey(message.username), sk: getFileSortKey(jobInput.fileId), decoder: FileRecord,
      client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME,
    }));
    if (!file) return throwE("File record not found");
    if (file.keepContentOutOfAi) {
      await fromPromise(markFileNeedsReview({ username: message.username, fileId: file.id, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME }));
      return fromPromise(updateJob({ username: message.username, jobId: message.jobId, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME, job: { status: "succeeded", completedAtIso: new Date(), jobType: message.jobType, input: jobInput, output: { fileId: file.id, status: "needs-review" } } satisfies SucceededJob }));
    }
    await fromPromise(markFileProcessing({ username: message.username, fileId: file.id, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME }));
    const object = await fromPromise(getObject({ filename: file.s3Key, bucketName: workerEnv.AWS_BUCKET_NAME, client: workerS3Client }));
    const extractedContent = extractNativeContent({ originalFilename: file.originalFilename, contentType: file.contentType ?? object.contentType, body: object.body });
    if (!extractedContent) {
      await fromPromise(markFileNeedsReview({ username: message.username, fileId: file.id, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME }));
      return fromPromise(updateJob({ username: message.username, jobId: message.jobId, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME, job: { status: "succeeded", completedAtIso: new Date(), jobType: message.jobType, input: jobInput, output: { fileId: file.id, status: "needs-review" } } satisfies SucceededJob }));
    }
    const classification = await fromPromise(classifyFile({ originalFilename: file.originalFilename, extractedContent }));
    const destinationKey = getOrganizedFileKey({ ownerId: message.username, fileId: file.id, category: classification.topLevelCategory, kind: classification.kind, primaryDate: classification.primaryDate, entity: classification.entities[0], originalFilename: file.originalFilename });
    await fromPromise(moveObject({ sourceKey: file.s3Key, destinationKey, bucketName: workerEnv.AWS_BUCKET_NAME, client: workerS3Client }));
    await fromPromise(markFileReady({ username: message.username, fileId: file.id, s3Key: destinationKey, classification, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME }));
    return fromPromise(updateJob({ username: message.username, jobId: message.jobId, client: workerDynamoDbClient, tableName: workerEnv.AWS_TABLE_NAME, job: { status: "succeeded", completedAtIso: new Date(), jobType: message.jobType, input: jobInput, output: { fileId: file.id, status: "ready" } } satisfies SucceededJob }));
  });
