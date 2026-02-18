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
import {
  getCompletedHabitLabels,
  getCompletedHobbyLabels,
  getJournalHobbiesWithLegacyFallback,
  JOURNAL_HABIT_FIELDS,
  JOURNAL_HOBBY_FIELDS,
} from "../lib/journal-habits";
import { SubmitButton } from "@/components/submit-button";
import { regenerateJournalAnalysisAction } from "../actions/regenerate-journal-analysis.action";
import { getSentimentValenceInfo } from "../lib/get-sentiment-valence-info.lib";

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

type Params = Promise<{ createdAtLocal: string }>;

const Journal: React.FC<{ params: Params }> = async (props) => {
  const params = await props.params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));
    const assets = journal.assets ?? [];
    const prettyContent = prettifyContent(journal.content ?? "");
    const completedHabits = getCompletedHabitLabels(journal.habits);
    const resolvedHobbies = getJournalHobbiesWithLegacyFallback({
      hobbies: journal.hobbies,
      habits: journal.habits,
    });
    const completedHobbies = getCompletedHobbyLabels(resolvedHobbies);

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

        <Fieldset legend="AI analysis">
          <div className="space-y-2 text-sm">
            {journal.dailySummary && (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Daily summary
                </p>
                <p>{journal.dailySummary}</p>
              </div>
            )}

            {journal.sentiment && (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Sentiment
                </p>
                {(() => {
                  const valenceInfo = getSentimentValenceInfo(
                    journal.sentiment.valence,
                  );
                  const confidenceText =
                    typeof journal.sentiment.confidence === "number"
                      ? ` / Confidence ${Math.round(journal.sentiment.confidence * 100)}%`
                      : "";
                  const tooltip = `Valence ${journal.sentiment.valence.toFixed(2)}${confidenceText}`;

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

            {!journal.dailySummary && !journal.sentiment && (
              <p className="text-zinc-600 dark:text-zinc-300">
                No AI analysis yet.
              </p>
            )}

            <form action={regenerateJournalAnalysisAction} className="pt-1">
              <input
                type="hidden"
                name="createdAtLocal"
                value={journal.createdAtLocal}
              />

              {JOURNAL_HABIT_FIELDS.filter(({ key }) => journal.habits?.[key]).map(
                ({ key }) => (
                  <input key={key} type="hidden" name={key} value="true" />
                ),
              )}

              {JOURNAL_HOBBY_FIELDS.filter(({ key }) => resolvedHobbies[key]).map(
                ({ key }) => (
                  <input key={key} type="hidden" name={key} value="true" />
                ),
              )}

              <SubmitButton variant="outline">Regenerate analysis</SubmitButton>
            </form>
          </div>
        </Fieldset>

        {completedHabits.length > 0 && (
          <Fieldset legend="Habits">
            <ul className="flex flex-wrap gap-2">
              {completedHabits.map((habit) => (
                <li
                  key={habit}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs"
                >
                  {habit}
                </li>
              ))}
            </ul>
          </Fieldset>
        )}

        {completedHobbies.length > 0 && (
          <Fieldset legend="Hobbies">
            <ul className="flex flex-wrap gap-2">
              {completedHobbies.map((hobby) => (
                <li
                  key={hobby}
                  className="rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs"
                >
                  {hobby}
                </li>
              ))}
            </ul>
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

        {!!prettyContent && (
          <Fieldset legend="Content">
            <div className="space-y-1">{prettyContent}</div>
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
