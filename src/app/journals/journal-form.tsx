import {
  createJournalAction,
  updateJournalAction,
  yyyyMmDdDate,
} from "./journal.model";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Journal } from "./journal.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";

const DEFAULT_TEMPLATE =
  "## Excited for" +
  "\n\n" +
  "## Important things to do today" +
  "\n\n" +
  "## Went well" +
  "\n\n" +
  "## To improve";

export const JournalForm: React.FC<{
  journal?: Journal;
}> = ({ journal }) => {
  return (
    <form
      action={journal ? updateJournalAction : createJournalAction}
      className="space-y-2"
    >
      {journal && (
        <input name="metadata" type="hidden" value={JSON.stringify(journal)} />
      )}

      <Heading level={1}>{journal ? "Edit" : "New"} journal</Heading>

      <Label label="Date">
        <Input
          name="createdAtIso"
          defaultValue={
            journal
              ? yyyyMmDdDate(journal.createdAtIso)
              : yyyyMmDdDate(new Date())
          }
        />
      </Label>

      <textarea
        name="content"
        defaultValue={journal?.content ?? DEFAULT_TEMPLATE}
        className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 w-full max-w-prose"
        rows={20}
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  );
};
