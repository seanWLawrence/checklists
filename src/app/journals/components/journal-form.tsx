"use client";

import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { CreatedAtLocal, Journal } from "../journal.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { DeleteJournalForm } from "../[createdAtLocal]/edit/delete-journal-form";
import { createJournalAction } from "../actions/create-journal.action";
import { updateJournalAction } from "../actions/update-journal.action";
import { JournalImage } from "./journal-image";
import { useState } from "react";
import { MAX_IMAGE_SIZE_MB } from "@/lib/upload.constants";

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
  imageUrl?: string;
  imageCaption?: string;
}> = ({ journal, imageUrl, imageCaption }) => {
  /**
   * Using unsafeDecode since the inputs are fully controlled
   */
  const todayLocal = CreatedAtLocal.unsafeDecode(new Date());
  const [currentImageSizeMb, setCurrentImageSizeMb] = useState<number | null>(
    null,
  );
  const formattedImageSizeMb =
    currentImageSizeMb === null ? "0" : currentImageSizeMb.toFixed(1);

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
        <Label label="Energy level (low to high)">
          <input
            type="range"
            name="energyLevel"
            min="1"
            max="5"
            defaultValue={journal?.energyLevel}
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
            required
          />
        </Label>

        {journal && (
          <input
            name="metadata"
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

        <Label label="Date" className="max-w-min">
          <Input
            type="date"
            defaultValue={journal?.createdAtLocal ?? todayLocal}
            name="createdAtLocal"
            required
          />
        </Label>

        <textarea
          name="content"
          defaultValue={journal?.content ?? DEFAULT_TEMPLATE}
          className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 max-w-prose w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          rows={20}
          required
        />

        <div className="space-y-2">
          <JournalImage imageUrl={imageUrl} />

          {!imageUrl && (
            <div className="space-y-1 flex flex-col">
              <div className="flex space-x-1 items-center max-w-min">
                <Label htmlFor="image" label="Image" />

                <span className="text-xs text-zinc-500">
                  {formattedImageSizeMb}/{MAX_IMAGE_SIZE_MB}mb
                </span>
              </div>

              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="w-full max-w-prose text-sm"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;

                  setCurrentImageSizeMb(
                    file ? file.size / (1024 * 1024) : null,
                  );
                }}
              />

              <Label label="Caption">
                <Input
                  type="text"
                  name="imageCaption"
                  defaultValue={imageCaption}
                  required={!imageUrl && currentImageSizeMb !== null}
                  disabled={!!imageUrl}
                  className={
                    imageUrl
                      ? "opacity-60 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800"
                      : ""
                  }
                />
              </Label>
            </div>
          )}
        </div>

        <div className="flex justify-end w-full max-w-xl">
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
