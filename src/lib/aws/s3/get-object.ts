import "server-only";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { EitherAsync } from "purify-ts/EitherAsync";
import { Readable } from "node:stream";

import { getS3Client } from "./get-s3-client";
import { logger } from "../../logger";
import { AWS_BUCKET_NAME } from "@/lib/secrets";

const toUint8Array = async (body: unknown): Promise<Uint8Array> => {
  if (body instanceof Uint8Array) {
    return body;
  }

  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }

  if (body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }

  if (body && typeof (body as ReadableStream).getReader === "function") {
    const buffer = await new Response(body as ReadableStream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return new Uint8Array(Buffer.concat(chunks));
  }

  throw new Error("Unsupported S3 body type");
};

export const getObject = ({
  filename,
}: {
  filename: string;
}): EitherAsync<unknown, { body: Uint8Array; contentType?: string }> => {
  return EitherAsync(async ({ liftEither, fromPromise, throwE }) => {
    try {
      const client = await fromPromise(getS3Client());

      const response = await client.send(
        new GetObjectCommand({
          Bucket: await liftEither(AWS_BUCKET_NAME),
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
