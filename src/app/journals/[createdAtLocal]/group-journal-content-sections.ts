import { NonEmptyList } from "purify-ts";
import { JournalBase } from "../journal.types";

export const groupJournalContentSections = (
  content: JournalBase["content"],
) => {
  return NonEmptyList.fromArray(content.split("\n")).map((list) => {
    const sections: {
      heading: string;
      children: string[];
    }[] = [];

    for (let i = 0; i < list.length; i++) {
      const row = list[i].trim();

      const isEmpty = row.length === 0;
      if (isEmpty) {
        continue;
      }

      const isHeading = row.startsWith("## ");
      if (isHeading) {
        const heading = NonEmptyList.fromArray(row.split("## "))
          .map((list) => list[1])
          .orDefault(list[0]);

        sections.push({ heading, children: [] });
        continue;
      }

      const lastSectionsIndex = sections.length - 1;
      if (lastSectionsIndex < 0) {
        continue;
      }

      sections[lastSectionsIndex].children.push(row);
    }

    return sections.filter((s) => s.children.length > 0);
  });
};
