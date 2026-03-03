import "@nobush/server-only";

import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";

import { AWS_BUCKET_NAME } from "@/lib/env.server";
import { logger } from "@/lib/logger";
import { s3Client } from "./s3-client";

export type S3ObjectSummary = {
  key: string;
  lastModified: Date | null;
};

export const listObjects = (): EitherAsync<unknown, S3ObjectSummary[]> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const objects: S3ObjectSummary[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: AWS_BUCKET_NAME,
            ContinuationToken: continuationToken,
          }),
        );

        objects.push(
          ...(response.Contents ?? [])
            .filter((item): item is { Key: string; LastModified?: Date } =>
              typeof item.Key === "string",
            )
            .map((item) => ({
              key: item.Key,
              lastModified: item.LastModified ?? null,
            })),
        );

        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);

      return objects;
    } catch (error) {
      logger.error("Error listing S3 objects", error);

      return throwE(error);
    }
  });
};
