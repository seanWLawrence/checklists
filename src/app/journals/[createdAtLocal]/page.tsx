import React from "react";
import { EitherAsync } from "purify-ts/EitherAsync";
import Link from "next/link";

import { Heading } from "@/components/heading";
import { CreatedAtLocal } from "../journal.types";
import { Label } from "@/components/label";
import { groupJournalContentSections } from "./group-journal-content-sections";
import { getJournal } from "../model/get-journal.model";
import { prettyDate } from "../lib/pretty-date.lib";
import { RelativeTime } from "@/components/relative-time";
import { AssetList } from "@/components/asset-list";
import { Fieldset } from "@/components/fieldset";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";

const prettyContent = (content: string): React.ReactNode => {
  return groupJournalContentSections(content)
    .map((sections) => {
      return (
        // Not actually an iterator, "map" in this context is different
        // eslint-disable-next-line react/jsx-key
        <div className="space-y-3">
          {sections.map((section, index) => {
            return (
              <div key={`${section.heading}-${index}`} className="space-y-1">
                <Heading level={3}>{section.heading}</Heading>

                <ul>
                  {section.children.map((row, index) => (
                    <li
                      className="list-disc ml-4 text-sm"
                      key={`${row}-${index}`}
                    >
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );
    })
    .extract();
};

type Params = Promise<{ createdAtLocal: string }>;

const Journal: React.FC<{ params: Params }> = async (props) => {
  const params = await props.params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));
    const assets = journal.assets ?? [];

    const assetUrls = await fromPromise(
      EitherAsync.all(
        assets.map((asset) => {
          return EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({ filename: asset.filename }),
            );

            return { asset, previewUrl };
          });
        }),
      ),
    );

    return (
      <main className="space-y-2 max-w-prose">
        <div className="flex flex-col space-y-1 pb-4">
          <div className="flex space-x-2 items-center">
            <Heading level={1}>{prettyDate(journal.createdAtLocal)}</Heading>

            <Link
              className="underline underline-offset-2 text-xs"
              href={`/journals/${journal.createdAtLocal}/edit`}
            >
              Edit
            </Link>
          </div>

          <RelativeTime date={journal.updatedAtIso} />
        </div>

        {!!journal.content.trim() && (
          <Fieldset legend="Content">
            <div className="space-y-1">{prettyContent(journal.content)}</div>
          </Fieldset>
        )}

        <Fieldset legend="Levels">
          <Label label="Energy level (low to high)">
            <input
              type="range"
              readOnly
              value={journal?.energyLevel}
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Mood (low to high)">
            <input
              type="range"
              value={journal?.moodLevel}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Health (low to high)">
            <input
              type="range"
              value={journal?.healthLevel}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Creativity (low to high)">
            <input
              type="range"
              value={journal?.creativityLevel}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Relationships (low to high)">
            <input
              type="range"
              value={journal?.relationshipsLevel}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>
        </Fieldset>

        {assetUrls.length > 0 && (
          <Fieldset legend="Assets">
            <AssetList
              assets={assetUrls.map(({ asset, previewUrl }) => ({
                ...asset,
                previewUrl,
              }))}
            />
          </Fieldset>
        )}
      </main>
    );
  })
    .mapLeft((e) => {
      return <p>{String(e)}</p>;
    })
    .run();

  return page.extract();
};

export default Journal;
