import { Maybe } from "purify-ts/Maybe";
import { ChecklistV2Structured } from "../checklist-v2.types";
import { UUID } from "@/lib/types";

export const checklistV2TaskFormToContent = ({
  checklist,
  getIsCompleted,
}: {
  checklist: ChecklistV2Structured;
  getIsCompleted: (itemId: UUID) => boolean;
}): string => {
  let content = "";

  for (const section of checklist.sections) {
    content += section.name;
    content += "\n";

    for (const item of section.items) {
      const completed = getIsCompleted(item.id);

      let row = "";

      if (completed) {
        row += "--";
      }

      row += item.name;

      if (item.note) {
        row += ` (${item.note})`;
      }

      if (item.timeEstimate) {
        row += ` ${item.timeEstimate}`;
      }

      content += row.trim();
      content += "\n";
    }

    content += "\n";
  }

  content = content.trimEnd();

  return content;
};

export const getIsCompletedFromStructuredChecklist =
  ({ checklist }: { checklist: ChecklistV2Structured }) =>
  (itemId: UUID): boolean => {
    for (const section of checklist.sections) {
      const isCompleted = section.items.some(
        (i) => i.id === itemId && i.completed,
      );

      if (isCompleted) {
        return true;
      }

      continue;
    }

    return false;
  };

export const getIsCompletedFromFormData =
  ({ formData }: { formData: FormData }) =>
  (itemId: UUID): boolean => {
    return Maybe.fromNullable(formData.get(`item__${itemId}`))
      .map((item) => item === "on")
      .orDefault(false);
  };
