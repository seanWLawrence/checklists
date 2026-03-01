import "@nobush/server-only";

import { DeleteVectorsCommand } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { s3VectorsClient } from "./s3vectors-client";
import { logger } from "@/lib/logger";

export const deleteVectors = ({
  vectorBucketName,
  indexName,
  keys,
}: {
  vectorBucketName: string;
  indexName: string;
  keys: string[];
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    if (keys.length === 0) {
      return;
    }

    try {
      await s3VectorsClient.send(
        new DeleteVectorsCommand({
          vectorBucketName,
          indexName,
          keys,
        }),
      );
    } catch (error) {
      logger.error("Error deleting S3 vectors", error);
      return throwE(error);
    }
  });
};
