"use client";

import { id } from "@/factories/id.factory";
import { ChecklistForm } from "../checklist-form";
import { checklist, checklistSection } from "@/factories/checklist.factory";

const initialChecklistId = id();
const initialSectionId = id();

const initialChecklist = checklist({
  id: initialChecklistId,
  name: "",
  sections: [
    checklistSection({
      id: initialSectionId,
      name: "",
      items: [],
    }),
  ],
});

const NewChecklist: React.FC<{}> = () => {
  return <ChecklistForm initialChecklist={initialChecklist} variant="new" />;
};

export default NewChecklist;
