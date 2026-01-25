"use client";

import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import { CreatedAtLocal, Journal } from "../journal.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { DeleteJournalForm } from "../[createdAtLocal]/edit/delete-journal-form";
import { createJournalAction } from "../actions/create-journal.action";
import { updateJournalAction } from "../actions/update-journal.action";
import { Fieldset } from "@/components/fieldset";
import { FileInput } from "@/components/file-input";

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

const EmptyFileInput: React.FC = () => (
  <p className="text-sm">No files added.</p>
);

export const JournalForm: React.FC<{
  journal?: Journal;
}> = ({ journal }) => {
  /**
   * Using unsafeDecode since the inputs are fully controlled
   */
  const todayLocal = CreatedAtLocal.unsafeDecode(new Date());

  const imageAssets = journal?.imageAssets ?? [];
  const audioAssets = journal?.audioAssets ?? [];

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
            <Input
              type="date"
              defaultValue={journal?.createdAtLocal ?? todayLocal}
              name="createdAtLocal"
              required
            />
          </Label>

          <Label label="Content">
            <textarea
              name="content"
              defaultValue={journal?.content ?? DEFAULT_TEMPLATE}
              className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              rows={20}
              required
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

        {journal && (
          <input
            name="journal"
            type="hidden"
            value={JSON.stringify(journal)}
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

        <Fieldset legend={"Images"} className="max-w-prose w-full space-y-4">
          {journal && imageAssets.length > 0 && (
            <div className="space-y-1">
              <Heading level={3}>Existing files</Heading>

              <ul className="list-disc">
                {imageAssets.map((x) => {
                  return (
                    <li className="text-sm list ml-4" key={x.path}>
                      {x.caption}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <FileInput
            name="images"
            variant="image"
            empty={journal ? null : <EmptyFileInput />}
          />
        </Fieldset>

        <Fieldset
          legend={"Audio files"}
          className="max-w-prose w-full space-y-4"
        >
          {journal && audioAssets.length > 0 && (
            <div className="space-y-1">
              <Heading level={3}>Existing files</Heading>

              <ul className="list-disc">
                {audioAssets.map((x) => {
                  return (
                    <li className="text-sm list ml-4" key={x.path}>
                      {x.caption}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <FileInput
            name="audios"
            variant="audio"
            empty={journal ? null : <EmptyFileInput />}
          />
        </Fieldset>

        <div className="flex justify-end w-full max-w-xl">
          <SubmitButton type="submit" variant="primary">
            Save
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
