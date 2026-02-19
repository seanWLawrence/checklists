import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { EitherAsync } from "purify-ts";

export const readPublicApiDocFile = ({
  filename,
}: {
  filename: "public-api.md" | "public-api.openapi.yaml";
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ fromPromise }) => {
    const filePath = path.join(process.cwd(), "docs", filename);
    const content = await fromPromise(
      EitherAsync(async ({ throwE }) => {
        try {
          return await readFile(filePath, "utf8");
        } catch (error) {
          return throwE(error);
        }
      }),
    );

    return content;
  });
};
