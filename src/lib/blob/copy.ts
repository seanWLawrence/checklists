import {
  copy as copyBlob,
  CopyBlobResult,
  CopyCommandOptions,
} from "@vercel/blob";
import { EitherAsync } from "purify-ts/EitherAsync";
import { logger } from "../logger";

export const copy = ({
  fromUrlOrPathname,
  toPathname,
  options,
}: {
  fromUrlOrPathname: string;
  toPathname: string;
  options: CopyCommandOptions;
}): EitherAsync<unknown, CopyBlobResult> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const result = await copyBlob(fromUrlOrPathname, toPathname, options);

      return result;
    } catch (e) {
      logger.error("Error copying blob: ", e);

      return throwE(e);
    }
  });
};
