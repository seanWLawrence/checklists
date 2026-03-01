import "@nobush/server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";

import { s3Client } from "./s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/env.server";
import { toUint8Array } from "@/lib/data/toUint8Array";

export const getObject = ({
  filename,
}: {
  filename: string;
}): EitherAsync<unknown, { body: Uint8Array; contentType?: string }> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: AWS_BUCKET_NAME,
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
