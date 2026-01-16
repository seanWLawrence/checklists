"use client";
import { SubmitButton } from "@/components/submit-button";
import { Journal } from "../../journal.types";
import { MenuButton } from "@/components/menu-button";
import { deleteJournalAction } from "../../actions/delete-journal.action";

export const DeleteJournalForm: React.FC<{ journal: Journal }> = ({
  journal,
}) => {
  return (
    <form
      action={async (formData) => {
        const confirmed = window.confirm("Delete?");

        if (confirmed) {
          await deleteJournalAction(formData);
        }
      }}
    >
      <input name="metadata" type="hidden" value={JSON.stringify(journal)} />

      <input
        name="createdAtLocal"
        type="hidden"
        value={journal.createdAtLocal}
      />

      <MenuButton
        menu={
          <div>
            <SubmitButton type="submit" variant="ghost">
              Delete
            </SubmitButton>
          </div>
        }
      />
    </form>
  );
};
