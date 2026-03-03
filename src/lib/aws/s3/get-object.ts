import "@nobush/server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";

import { logger } from "../../logger";
import { toUint8Array } from "@/lib/data/toUint8Array";

export const getObject = ({
  filename,
  client,
  bucketName,
}: {
  filename: string;
  client?: S3Client;
  bucketName?: string;
}): EitherAsync<unknown, { body: Uint8Array; contentType?: string }> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const resolvedClient = client ?? (await import("./s3-client")).s3Client;
      const resolvedBucketName =
        bucketName ?? (await import("@/lib/env.server")).AWS_BUCKET_NAME;

      const response = await resolvedClient.send(
        new GetObjectCommand({
          Bucket: resolvedBucketName,
          Key: filename,
        }),
      );

      if (!response.Body) {
        return throwE("S3 object has no body");
      }

      const body = await toUint8Array(response.Body);

      return { body, contentType: response.ContentType };
    } catch (error) {
      logger.error("Error getting S3 object", error);

      return throwE(error);
    }
  });
};
