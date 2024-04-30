import { createJournalAction, updateJournalAction } from "./journal.model";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Journal } from "./journal.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { DeleteJournalForm } from "./[createdAtLocal]/edit/delete-journal-form";

const DEFAULT_TEMPLATE =
  "## Dreams" +
  "\n\n" +
  "## Grateful for" +
  "\n\n" +
  "## What could make today great?" +
  "\n\n" +
  "## Daily affirmation" +
  "\n\n" +
  "## Highlights of the day" +
  "\n\n" +
  "## What did I learn today?";

export const JournalForm: React.FC<{
  journal?: Journal;
}> = ({ journal }) => {
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

        <Label label="Date">
          <Input
            type="date"
            defaultValue={journal?.createdAtLocal}
            name="createdAtLocal"
            required
          />
        </Label>

        <textarea
          name="content"
          defaultValue={journal?.content ?? DEFAULT_TEMPLATE}
          className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 max-w-prose w-full"
          rows={20}
          required
        />

        <div className="flex justify-end w-full max-w-xl">
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
