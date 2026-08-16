import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EitherAsync } from "purify-ts/EitherAsync";
import { updateItem } from "@/lib/aws/dynamodb/update-item";
import { getFilePartitionKey, getFileSortKey } from "@/app/files/lib/file-record-keys";
import { FileClassification } from "./classify-file";

const updateStatus = ({ username, fileId, status, client, tableName, error }: { username: string; fileId: string; status: "processing" | "needs-review" | "failed"; client: DynamoDBDocumentClient; tableName: string; error?: string }): EitherAsync<unknown, void> =>
  updateItem({
    pk: getFilePartitionKey(username), sk: getFileSortKey(fileId), client, tableName,
    updateExpression: error
      ? "SET #status = :status, #processingError = :processingError, #updatedAtIso = :updatedAtIso"
      : "SET #status = :status, #updatedAtIso = :updatedAtIso REMOVE #processingError",
    attributeNames: { "#status": "status", "#processingError": "processingError", "#updatedAtIso": "updatedAtIso" },
    attributeValues: {
      ":status": status,
      ":updatedAtIso": new Date().toISOString(),
      ...(error ? { ":processingError": error } : {}),
    },
  });

export const markFileProcessing = (params: Omit<Parameters<typeof updateStatus>[0], "status" | "error">) => updateStatus({ ...params, status: "processing" });
export const markFileNeedsReview = (params: Omit<Parameters<typeof updateStatus>[0], "status" | "error">) => updateStatus({ ...params, status: "needs-review" });
export const markFileFailed = ({ error, ...params }: Omit<Parameters<typeof updateStatus>[0], "status">) => updateStatus({ ...params, status: "failed", error });

export const markFileReady = ({ username, fileId, s3Key, classification, client, tableName }: { username: string; fileId: string; s3Key: string; classification: FileClassification; client: DynamoDBDocumentClient; tableName: string }): EitherAsync<unknown, void> =>
  updateItem({
    pk: getFilePartitionKey(username), sk: getFileSortKey(fileId), client, tableName,
    updateExpression: "SET #status = :status, #s3Key = :s3Key, #topLevelCategory = :topLevelCategory, #kind = :kind, #title = :title, #primaryDate = :primaryDate, #entities = :entities, #tags = :tags, #summary = :summary, #classificationConfidence = :classificationConfidence, #updatedAtIso = :updatedAtIso REMOVE #processingError",
    attributeNames: { "#status": "status", "#s3Key": "s3Key", "#topLevelCategory": "topLevelCategory", "#kind": "kind", "#title": "title", "#primaryDate": "primaryDate", "#entities": "entities", "#tags": "tags", "#summary": "summary", "#classificationConfidence": "classificationConfidence", "#updatedAtIso": "updatedAtIso", "#processingError": "processingError" },
    attributeValues: { ":status": "ready", ":s3Key": s3Key, ":topLevelCategory": classification.topLevelCategory, ":kind": classification.kind, ":title": classification.title, ":primaryDate": classification.primaryDate ?? "", ":entities": classification.entities, ":tags": classification.tags, ":summary": classification.summary ?? "", ":classificationConfidence": classification.confidence, ":updatedAtIso": new Date().toISOString() },
  });
