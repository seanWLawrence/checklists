import {
  copy as copyBlob,
  CopyBlobResult,
  CopyCommandOptions,
} from "@vercel/blob";
import { EitherAsync } from "purify-ts/EitherAsync";

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
      return throwE(e);
    }
  });
};
