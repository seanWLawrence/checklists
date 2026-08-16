import "@nobush/server-only";

import { CopyObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";

export const moveObject = ({ sourceKey, destinationKey, client, bucketName }: { sourceKey: string; destinationKey: string; client?: S3Client; bucketName?: string }): EitherAsync<unknown, void> =>
  EitherAsync(async ({ throwE }) => {
    try {
      const resolvedClient = client ?? (await import("./s3-client")).s3Client;
      const resolvedBucketName = bucketName ?? (await import("@/lib/env.server")).AWS_BUCKET_NAME;
      await resolvedClient.send(new CopyObjectCommand({
        Bucket: resolvedBucketName,
        Key: destinationKey,
        CopySource: `${resolvedBucketName}/${encodeURIComponent(sourceKey).replace(/%2F/g, "/")}`,
      }));
      await resolvedClient.send(new DeleteObjectCommand({ Bucket: resolvedBucketName, Key: sourceKey }));
    } catch (error) {
      return throwE(error);
    }
  });
