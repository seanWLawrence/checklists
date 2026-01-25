import "server-only";

import { Upload } from "@aws-sdk/lib-storage";
import { EitherAsync } from "purify-ts/EitherAsync";
import { logger } from "../../logger";
import { Readable } from "node:stream";
import { getS3Client } from "./get-s3-client";
import { AWS_BUCKET_NAME } from "@/lib/secrets";

export const putObject = ({
  path,
  body,
  contentType,
}: {
  path: string;
  body: string | Uint8Array | Buffer | Readable;
  contentType?: string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise, liftEither, throwE }) => {
    try {
      const client = await fromPromise(getS3Client());

      const parallelUploads3 = new Upload({
        client,
        params: {
          Bucket: await liftEither(AWS_BUCKET_NAME),
          Key: path,
          Body: body,
          ContentType: contentType,
        },
      });

      parallelUploads3.on("httpUploadProgress", (progress) => {
        logger.debug(progress);
      });

      await parallelUploads3.done();
    } catch (e) {
      logger.error("Error putting object", e);
      return throwE(e);
    }
  });
};
