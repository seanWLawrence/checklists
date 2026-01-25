import "server-only";

import { EitherAsync } from "purify-ts/EitherAsync";

import { getAssetPathsAndPutObjectEitherAsyncs } from "@/lib/form-data/get-asset-paths-and-put-object-either-asyncs";
import { JournalAsset } from "../journal.types";

export const putJournalAssets = ({
  audioFiles,
  imageFiles,
  formData,
}: {
  formData: FormData;
  audioFiles: File[];
  imageFiles: File[];
}): EitherAsync<
  unknown,
  { audioAssets: JournalAsset[]; imageAssets: JournalAsset[] }
> => {
  return EitherAsync(async ({ fromPromise }) => {
    const putAssetsEitherAsyncs: EitherAsync<unknown, void>[] = [];
    let imageAssets: JournalAsset[] = [];
    let audioAssets: JournalAsset[] = [];

    if (audioFiles.length > 0) {
      const { assets, putObjectEitherAsyncs } = await fromPromise(
        getAssetPathsAndPutObjectEitherAsyncs({
          formData,
          files: audioFiles,
          name: "audios",
        }),
      );

      putAssetsEitherAsyncs.push(...putObjectEitherAsyncs);
      audioAssets = assets;
    }

    if (imageFiles.length > 0) {
      const { assets, putObjectEitherAsyncs } = await fromPromise(
        getAssetPathsAndPutObjectEitherAsyncs({
          formData,
          files: imageFiles,
          name: "images",
        }),
      );

      putAssetsEitherAsyncs.push(...putObjectEitherAsyncs);
      imageAssets = assets;
    }

    await fromPromise(EitherAsync.all(putAssetsEitherAsyncs));

    return { audioAssets, imageAssets };
  });
};
