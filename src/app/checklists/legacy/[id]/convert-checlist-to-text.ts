import { Checklist } from "../checklist.types";

export const convertChecklistSectionsToTextContent = (
  checklist: Checklist,
): string => {
  let sectionsContent: string = "";

  for (const section of checklist.sections) {
    const numIncompleteItems = section.items.filter((i) => !i.completed).length;

    if (numIncompleteItems === 0) {
      continue;
    }

    sectionsContent += `\n${section.name}\n`;

    for (const item of section.items) {
      if (!item.completed) {
        let itemText = `- ${item.name}`;

        if (item.note) {
          itemText += ` (${item.note})`;
        }

        sectionsContent += `${itemText}\n`;
      }
    }
  }

  if (sectionsContent.length === 0) {
    return "";
  }

  return `${checklist.name}\n${sectionsContent}`.trimEnd();
};
