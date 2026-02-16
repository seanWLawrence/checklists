"use server";

import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import { Journal } from "../journal.types";
import { Label } from "@/components/label";
import { JournalDateInput } from "./journal-date-input";
import { DeleteJournalForm } from "../[createdAtLocal]/edit/delete-journal-form";
import { createJournalAction } from "../actions/create-journal.action";
import { updateJournalAction } from "../actions/update-journal.action";
import { Fieldset } from "@/components/fieldset";
import { EitherAsync } from "purify-ts/EitherAsync";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { JournalFormAssetsAndContent } from "./journal-form-assets-and-content";
import { JOURNAL_HABIT_FIELDS } from "../lib/journal-habits";

const DEFAULT_TEMPLATE =
  "## Dreams" +
  "\n\n" +
  "## How I'm feelin" +
  "\n\n" +
  "## If today was my last day alive?" +
  "\n\n" +
  "## Highlights of the day" +
  "\n\n" +
  "## What did I learn?";

export const JournalForm: React.FC<{
  journal?: Journal;
}> = async ({ journal }) => {
  const response = await EitherAsync(async ({ fromPromise }) => {

    const sortedAssets = await fromPromise(
      EitherAsync.all(
        [...(journal?.assets || [])]
          .sort((a, b) => a.variant.localeCompare(b.variant))
          .map((asset) =>
            EitherAsync(async ({ fromPromise }) => {
              const previewUrl = await fromPromise(
                getPresignedGetObjectUrl({ filename: asset.filename }),
              );

              return { ...asset, previewUrl };
            }),
          ),
      ),
    );

    return (
      <div className="space-y-2 max-w-prose">
        <div className="flex space-x-1 items-center">
          <Heading level={1}>{journal ? "Edit" : "New"} journal</Heading>

          {journal && <DeleteJournalForm journal={journal} />}
        </div>

        <form
          action={journal ? updateJournalAction : createJournalAction}
          className="space-y-2"
        >
          <Fieldset legend={"Main"}>
            <Label label="Date" className="max-w-min">
              <JournalDateInput
                name="createdAtLocal"
                required
                defaultValue={journal?.createdAtLocal}
              />
            </Label>
          </Fieldset>

          <Fieldset legend={"Levels"}>
            <Label label="Energy level (low to high)">
              <input
                type="range"
                name="energyLevel"
                min="1"
                max="5"
                defaultValue={journal?.energyLevel}
                className="accent-blue-500"
                required
              />
            </Label>

            <Label label="Mood (low to high)">
              <input
                type="range"
                name="moodLevel"
                min="1"
                max="5"
                defaultValue={journal?.moodLevel}
                className="accent-blue-500"
                required
              />
            </Label>

            <Label label="Health (low to high)">
              <input
                type="range"
                name="healthLevel"
                min="1"
                max="5"
                defaultValue={journal?.healthLevel}
                className="accent-blue-500"
                required
              />
            </Label>

            <Label label="Creativity (low to high)">
              <input
                type="range"
                name="creativityLevel"
                min="1"
                max="5"
                defaultValue={journal?.creativityLevel}
                className="accent-blue-500"
                required
              />
            </Label>

            <Label label="Relationships (low to high)">
              <input
                type="range"
                name="relationshipsLevel"
                min="1"
                max="5"
                defaultValue={journal?.relationshipsLevel}
                className="accent-blue-500"
                required
              />
            </Label>
          </Fieldset>

          <Fieldset legend="Habits">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JOURNAL_HABIT_FIELDS.map(({ key, label }) => (
                <label
                  key={key}
                  className="inline-flex items-center gap-2 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-sm"
                >
                  <input
                    type="checkbox"
                    name={key}
                    value="true"
                    defaultChecked={Boolean(journal?.habits?.[key])}
                    className="accent-blue-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Fieldset>

          {journal && (
            <input
              name="metadata"
              type="hidden"
              value={JSON.stringify({
                id: journal.id,
                createdAtIso: journal.createdAtIso,
                updatedAtIso: journal.updatedAtIso,
                user: journal.user,
              })}
              readOnly
              required
            />
          )}

          {journal && (
            <input
              name="existingCreatedAtLocal"
              type="hidden"
              value={journal.createdAtLocal}
              readOnly
              required
            />
          )}

          <JournalFormAssetsAndContent
            initialContent={journal?.content ?? DEFAULT_TEMPLATE}
            initialAssets={sortedAssets}
          />

          <div className="flex justify-end w-full max-w-prose">
            <SubmitButton type="submit" variant="primary">
              Save
            </SubmitButton>
          </div>
        </form>
      </div>
    );
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
