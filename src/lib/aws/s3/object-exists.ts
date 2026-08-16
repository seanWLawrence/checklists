import "@nobush/server-only";

import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";
import { AWS_BUCKET_NAME } from "@/lib/env.server";
import { s3Client } from "./s3-client";

export const objectExists = ({ key }: { key: string }): EitherAsync<unknown, boolean> =>
  EitherAsync(async ({ throwE }) => {
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: key }));
      return true;
    } catch (error) {
      const statusCode = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (statusCode === 404) return false;
      return throwE(error);
    }
  });
