import {
  ListBlobResult,
  list as listBlobs,
  ListCommandOptions,
} from "@vercel/blob";
import { EitherAsync } from "purify-ts/EitherAsync";

export const list = ({
  options,
}: {
  options: ListCommandOptions;
}): EitherAsync<unknown, ListBlobResult> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const result = await listBlobs(options);

      return result;
    } catch (e) {
      return throwE(e);
    }
  });
};
