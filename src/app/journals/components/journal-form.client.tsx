"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import { Journal, JournalAsset } from "../journal.types";
import { Label } from "@/components/label";
import { JournalDateInput } from "./journal-date-input";
import { DeleteJournalForm } from "../[createdAtLocal]/edit/delete-journal-form";
import { createJournalAction } from "../actions/create-journal.action";
import { updateJournalAction } from "../actions/update-journal.action";
import { Fieldset } from "@/components/fieldset";
import { JournalFormAssetsAndContent } from "./journal-form-assets-and-content";
import {
  JOURNAL_ACTIVITY_AMOUNT_OPTIONS,
  JOURNAL_ACTIVITY_GROUPS,
  JOURNAL_RATING_FIELDS,
} from "../lib/journal-check-in";

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

interface SortedAssetItem extends JournalAsset {
  previewUrl: string;
}

export const JournalFormClient: React.FC<{
  journal?: Journal;
  sortedAssets: SortedAssetItem[];
}> = ({ journal, sortedAssets }) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isBusy = isTranscribing || isUploading;
  const busyMessage = isUploading
    ? isTranscribing
      ? "Wait for the recording to finish uploading and transcribing before saving."
      : "Wait for the recording to finish uploading before saving."
    : "Wait for the recording to finish transcribing before saving.";

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!isBusy) {
      return;
    }

    event.preventDefault();
    window.alert(busyMessage);
  };

  return (
    <div className="space-y-2 max-w-prose">
      <div className="flex space-x-1 items-center">
        <Heading level={1}>{journal ? "Edit" : "New"} journal</Heading>

        {journal && <DeleteJournalForm journal={journal} />}
      </div>

      <form
        action={journal ? updateJournalAction : createJournalAction}
        className="space-y-2"
        onSubmit={onSubmit}
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
          initialContent={journal?.entry.content ?? ""}
          initialTranscriptionRaw={journal?.entry.transcriptionRaw ?? ""}
          contentPlaceholder={DEFAULT_TEMPLATE}
          initialAssets={sortedAssets}
          onTranscribingChangeAction={setIsTranscribing}
          onUploadingChangeAction={setIsUploading}
        />

        <Fieldset legend={"Ratings"}>
          {JOURNAL_RATING_FIELDS.map(({ formName, key, label }) => (
            <Label key={formName} label={`${label} (low to high)`}>
              <input
                type="range"
                name={formName}
                min="1"
                max="5"
                defaultValue={journal?.checkIn.ratings?.[key] ?? 3}
                className="accent-blue-500"
                required
              />
            </Label>
          ))}
        </Fieldset>

        {JOURNAL_ACTIVITY_GROUPS.map((group) => (
          <Fieldset key={group.key} legend={group.label}>
            <div className="grid grid-cols-1 gap-3">
              {group.fields.map((field) => {
                const groupValues = journal?.checkIn[group.key] as
                  | Record<string, string | undefined>
                  | undefined;
                const selectedValue = groupValues?.[field.key] ?? "";

                return (
                  <div
                    key={field.formName}
                    className="space-y-2 rounded border border-zinc-300 p-3 dark:border-zinc-700"
                  >
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {field.label}
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name={field.formName}
                          value=""
                          defaultChecked={selectedValue === ""}
                          className="accent-blue-500"
                        />
                        <span>None</span>
                      </label>

                      {JOURNAL_ACTIVITY_AMOUNT_OPTIONS.map((value) => (
                        <label
                          key={value}
                          className="flex items-center gap-2 text-xs"
                        >
                          <input
                            type="radio"
                            name={field.formName}
                            value={value}
                            defaultChecked={selectedValue === value}
                            className="accent-blue-500"
                          />
                          <span>
                            {value === "some"
                              ? "Some"
                              : value === "aLot"
                                ? "A lot"
                                : "Medium"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Fieldset>
        ))}

        <div className="sticky bottom-0 z-10 flex w-full max-w-prose flex-col items-end gap-1 bg-white/95 px-0 py-3 backdrop-blur dark:bg-zinc-950/95">
          {isBusy && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {busyMessage}
            </p>
          )}
          <SubmitButton type="submit" variant="primary" disabled={isBusy}>
            {isBusy ? "Processing recording…" : "Save"}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
