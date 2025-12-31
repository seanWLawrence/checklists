import { put as putBlob, PutBlobResult, PutCommandOptions } from "@vercel/blob";
import { Readable } from "node:stream";
import { EitherAsync } from "purify-ts/EitherAsync";

import { logger } from "../logger";

type PutBody =
  | string
  | Readable
  | Buffer
  | Blob
  | ArrayBuffer
  | ReadableStream
  | File;

export const put = ({
  pathname,
  options,
  body,
}: {
  pathname: string;
  body: PutBody;
  options: PutCommandOptions;
}): EitherAsync<unknown, PutBlobResult> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const result = await putBlob(pathname, body, options);

      return result;
    } catch (e) {
      logger.error("Error uploading blob: ", e);

      return throwE(e);
    }
  });
};
