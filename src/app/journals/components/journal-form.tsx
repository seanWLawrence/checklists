import { Heading } from "@/components/heading";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { Journal } from "../journal.types";
import { getJournalAssetResponseContentType } from "../lib/get-journal-asset-response-content-type.lib";
import { JournalFormClient } from "./journal-form.client";

export const JournalForm: React.FC<{
  journal?: Journal;
}> = async ({ journal }) => {
  const response = await EitherAsync(async ({ fromPromise }) => {
    const sortedAssets = await fromPromise(
      EitherAsync.all(
        [...(journal?.entry.assets || [])]
          .sort((a, b) => a.variant.localeCompare(b.variant))
          .map((asset) =>
            EitherAsync(async ({ fromPromise }) => {
              const previewUrl = await fromPromise(
                getPresignedGetObjectUrl({
                  filename: asset.filename,
                  responseContentType: getJournalAssetResponseContentType({
                    filename: asset.filename,
                  }),
                }),
              );

              return { ...asset, previewUrl };
            }),
          ),
      ),
    );

    return <JournalFormClient journal={journal} sortedAssets={sortedAssets} />;
  }).mapLeft((error) => {
    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Journal</Heading>

          <div className="space-y-2">
            <p>Error loading journal.</p>

            <pre className="text-xs text-red-800 max-w-prose">
              {String(error)}
            </pre>
          </div>
        </section>
      </main>
    );
  });

  return response.extract();
};
