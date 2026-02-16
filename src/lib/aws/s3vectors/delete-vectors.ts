import "server-only";

import { DeleteVectorsCommand } from "@aws-sdk/client-s3vectors";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getS3VectorsClient } from "./get-s3vectors-client";
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
  return EitherAsync(async ({ fromPromise, throwE }) => {
    if (keys.length === 0) {
      return;
    }

    try {
      const client = await fromPromise(getS3VectorsClient());
      await client.send(
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
