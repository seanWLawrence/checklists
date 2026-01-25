import { JournalAsset } from "@/app/journals/journal.types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { putObject } from "../aws/s3/put-object";
import { getAssetPath } from "../aws/s3/get-asset-path";
import { getStringFromFormData } from "./get-string-from-form-data";
import { Readable } from "node:stream";
import { Left, Right } from "purify-ts/Either";

interface GetAssetPathsAndPutObjectEitherAsyncsPayload {
  assets: JournalAsset[];
  putObjectEitherAsyncs: EitherAsync<unknown, void>[];
}

export const getAssetPathsAndPutObjectEitherAsyncs = ({
  files,
  formData,
  name,
}: {
  files: File[];
  formData: FormData;
  name: string;
}): EitherAsync<unknown, GetAssetPathsAndPutObjectEitherAsyncsPayload> => {
  return EitherAsync<unknown, GetAssetPathsAndPutObjectEitherAsyncsPayload>(
    async () => {
      const assets: JournalAsset[] = [];
      const putObjectEitherAsyncs: EitherAsync<unknown, void>[] = [];

      if (files.length > 0) {
        for (const [index, file] of files.entries()) {
          const caption = getStringFromFormData({
            formData,
            name: `${name}_caption_${index}`,
          })
            .chain((caption) =>
              caption ? Right(caption) : Left("Caption is empty"),
            )
            .orDefault(file.name);

          const path = getAssetPath({
            fileName: file.name,
            module: "journals",
          });

          const body = Readable.fromWeb(file.stream());

          putObjectEitherAsyncs.push(
            putObject({ path, body, contentType: file.type }),
          );
          assets.push({ path, caption });
        }
      }

      return { assets, putObjectEitherAsyncs };
    },
  );
};
