import { del as delBlob } from "@vercel/blob";
import { EitherAsync } from "purify-ts/EitherAsync";
import { logger } from "../logger";

export const del = ({
  urls,
}: {
  urls: string[] | string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      await delBlob(urls);
    } catch (e) {
      logger.error("Error deleting blob: ", e);

      return throwE(e);
    }
  });
};
