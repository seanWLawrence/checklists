import { del as delBlob } from "@vercel/blob";
import { EitherAsync } from "purify-ts/EitherAsync";

export const del = ({
  urls,
}: {
  urls: string[] | string;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      await delBlob(urls);
    } catch (e) {
      return throwE(e);
    }
  });
};
