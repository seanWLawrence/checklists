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
import { getJournalCheckInDisplayGroups } from "../lib/journal-check-in";
import { getJournalAssetResponseContentType } from "../lib/get-journal-asset-response-content-type.lib";
import { LinkButton } from "@/components/link-button";
import { getSentimentValenceInfo } from "../lib/get-sentiment-valence-info.lib";
import { getAllCreatedAtLocals } from "../model/get-all-created-at-locals.model";
import { getAdjacentCreatedAtLocals } from "../lib/get-adjacent-created-at-locals.lib";

const prettifyContent = (content: string): React.ReactNode | undefined => {
  const sections = groupJournalContentSections(content).extract();

  if (!sections || sections.length === 0) {
    return undefined;
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => {
        return (
          <div key={`${section.heading}-${index}`} className="space-y-1">
            <Heading level={3}>{section.heading}</Heading>

            <ul>
              {section.children.map((row, index) => (
                <li className="list-disc ml-4 text-sm" key={`${row}-${index}`}>
                  {row}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

const getActivityAmountInfo = (value: "some" | "medium" | "aLot") => {
  switch (value) {
    case "some":
      return {
        label: "Some",
        dotsFilled: 1,
      };
    case "medium":
      return {
        label: "Medium",
        dotsFilled: 2,
      };
    case "aLot":
      return {
        label: "A lot",
        dotsFilled: 3,
      };
  }
};

const activityAmountOrder = ["some", "medium", "aLot"] as const;
const viceAmountOrder = ["some", "medium", "aLot"] as const;

const ActivityAmountDots: React.FC<{
  value: "some" | "medium" | "aLot";
  activeDotClassName?: string;
}> = ({ value, activeDotClassName = "bg-emerald-600" }) => {
  const amountInfo = getActivityAmountInfo(value);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${amountInfo.label} activity amount`}
      title={amountInfo.label}
    >
      {Array.from({ length: amountInfo.dotsFilled }).map((_, index) => (
        <span
          key={index}
          className={`inline-block h-2.5 w-2.5 rounded-full ${activeDotClassName}`}
        />
      ))}
    </div>
  );
};

type Params = Promise<{ createdAtLocal: string }>;

const Journal: React.FC<{ params: Params }> = async (props) => {
  const params = await props.params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));
    const allCreatedAtLocals = await fromPromise(getAllCreatedAtLocals());
    const { previousCreatedAtLocal, nextCreatedAtLocal } =
      getAdjacentCreatedAtLocals({
        createdAtLocal: journal.createdAtLocal,
        createdAtLocals: allCreatedAtLocals,
      });
    const assets = journal.entry.assets ?? [];
    const prettyContent = prettifyContent(journal.entry.content ?? "");
    const activityGroups = getJournalCheckInDisplayGroups({
      checkIn: journal.checkIn,
    });
    const activityItems = activityGroups
      .filter((group) => group.key !== "vices")
      .flatMap((group) => group.items);
    const viceItems = activityGroups
      .filter((group) => group.key === "vices")
      .flatMap((group) => group.items);

    const assetUrls = await fromPromise(
      EitherAsync.all(
        assets.map((asset) => {
          return EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({
                filename: asset.filename,
                responseContentType: getJournalAssetResponseContentType({
                  filename: asset.filename,
                }),
              }),
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

        <Fieldset legend="AI analysis">
          <div className="space-y-2 text-sm">
            {journal.analysis?.dailySummary && (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Daily summary
                </p>
                <p>{journal.analysis.dailySummary}</p>
              </div>
            )}

            {journal.analysis?.sentiment && (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Sentiment
                </p>
                {(() => {
                  const valenceInfo = getSentimentValenceInfo(
                    journal.analysis.sentiment.valence,
                  );
                  const confidenceText =
                    typeof journal.analysis.sentiment.confidence === "number"
                      ? ` / Confidence ${Math.round(journal.analysis.sentiment.confidence * 100)}%`
                      : "";
                  const tooltip = `Valence ${journal.analysis.sentiment.valence.toFixed(2)}${confidenceText}`;

                  return (
                    <p>
                      <span
                        className={`font-medium ${valenceInfo.className}`}
                        title={tooltip}
                      >
                        {valenceInfo.label}
                      </span>
                    </p>
                  );
                })()}
              </div>
            )}

            {!journal.analysis?.dailySummary &&
              !journal.analysis?.sentiment && (
                <p className="text-zinc-600 dark:text-zinc-300">
                  No AI analysis yet.
                </p>
              )}
          </div>
        </Fieldset>

        <Fieldset legend="Ratings">
          <Label label="Energy (low to high)">
            <input
              type="range"
              readOnly
              value={journal.checkIn.ratings?.energy}
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Mood (low to high)">
            <input
              type="range"
              value={journal.checkIn.ratings?.mood}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>

          <Label label="Productivity (low to high)">
            <input
              type="range"
              value={journal.checkIn.ratings?.productivity}
              readOnly
              min="1"
              max="5"
              className="accent-blue-500"
            />
          </Label>
        </Fieldset>

        <Fieldset legend="Activities">
          <div className="space-y-3">
            {activityAmountOrder.map((activityAmount) => {
              const items = activityItems.filter(
                (item) => item.value === activityAmount,
              );

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={activityAmount} className="space-y-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <ActivityAmountDots
                      value={activityAmount}
                      activeDotClassName={
                        activityAmount === "some"
                          ? "bg-emerald-300"
                          : activityAmount === "medium"
                            ? "bg-emerald-400"
                            : "bg-emerald-600"
                      }
                    />
                    <span>{getActivityAmountInfo(activityAmount).label}</span>
                  </div>

                  <ul className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Fieldset>

        {viceItems.length > 0 && (
          <Fieldset legend="Vices">
            <div className="space-y-3">
              {viceAmountOrder.map((activityAmount) => {
                const items = viceItems.filter(
                  (item) => item.value === activityAmount,
                );

                if (items.length === 0) {
                  return null;
                }

                return (
                  <div key={activityAmount} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      <ActivityAmountDots
                        value={activityAmount}
                        activeDotClassName={
                          activityAmount === "aLot"
                            ? "bg-red-600"
                            : activityAmount === "medium"
                              ? "bg-amber-600"
                              : "bg-yellow-500"
                        }
                      />
                      <span>{getActivityAmountInfo(activityAmount).label}</span>
                    </div>

                    <ul className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <li
                          key={item.key}
                          className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Fieldset>
        )}

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

        {!!prettyContent && (
          <Fieldset legend="Content">
            <div className="space-y-1">{prettyContent}</div>
          </Fieldset>
        )}

        {(journal.entry.transcriptionRaw?.trim() ||
          (journal.entry.assets ?? []).some(
            (asset) => asset.transcriptionMetadata,
          )) && (
          <Fieldset legend="Transcription">
            <div className="space-y-2">
              {journal.entry.transcriptionRaw?.trim() && (
                <details className="text-sm">
                  <summary className="cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                    View raw transcription
                  </summary>

                  <pre className="mt-2 whitespace-pre-wrap break-words rounded border border-zinc-200 dark:border-zinc-700 p-2 text-xs bg-zinc-50 dark:bg-zinc-900/50">
                    {journal.entry.transcriptionRaw}
                  </pre>
                </details>
              )}

              {(journal.entry.assets ?? [])
                .filter((asset) => asset.transcriptionMetadata)
                .map((asset) => (
                  <details className="text-sm" key={asset.filename}>
                    <summary className="cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                      {asset.filename} metadata
                    </summary>

                    <pre className="mt-2 whitespace-pre-wrap break-words rounded border border-zinc-200 dark:border-zinc-700 p-2 text-xs bg-zinc-50 dark:bg-zinc-900/50">
                      {JSON.stringify(asset.transcriptionMetadata, null, 2)}
                    </pre>
                  </details>
                ))}
            </div>
          </Fieldset>
        )}

        {(previousCreatedAtLocal || nextCreatedAtLocal) && (
          <div className="flex items-center justify-between gap-2 pt-2">
            {previousCreatedAtLocal ? (
              <LinkButton href={`/journals/${previousCreatedAtLocal}`}>
                Previous (
                {prettyDate(previousCreatedAtLocal, { withYear: false })})
              </LinkButton>
            ) : (
              <div />
            )}

            {nextCreatedAtLocal && (
              <LinkButton href={`/journals/${nextCreatedAtLocal}`}>
                Next ({prettyDate(nextCreatedAtLocal, { withYear: false })})
              </LinkButton>
            )}
          </div>
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
