"use client";

import { id } from "@/factories/id.factory";
import { ChecklistForm } from "../checklist-form";
import {
  checklist,
  checklistItem,
  checklistSection,
} from "@/factories/checklist.factory";

const initialChecklistId = id();
const initialSectionId = id();
const initialItemId = id();

const initialChecklist = checklist({
  id: initialChecklistId,
  sections: [
    checklistSection({
      id: initialSectionId,
      checklistId: initialChecklistId,
      items: [
        checklistItem({
          id: initialItemId,
          checklistSectionId: initialSectionId,
        }),
      ],
    }),
  ],
});

const NewChecklist: React.FC<{}> = () => {
  return <ChecklistForm initialChecklist={initialChecklist} variant="new" />;
};

export default NewChecklist;
