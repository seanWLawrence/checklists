import {
  ChecklistV2Structured,
  ChecklistV2StructuredItem,
  ChecklistV2StructuredSection,
  TimeEstimate,
} from "../checklist-v2.types";
import { Maybe, optional, string } from "purify-ts";
import { id } from "@/factories/id.factory";

const noteRegex = /\(.*\)/g;
const timeEstimateRegex = /\d+(m|h)/g;
const completedRegex = /^--/g;

export const structureChecklistContentRow = (
  contentRow: string,
): Maybe<ChecklistV2StructuredItem> => {
  const trimmedContentRow = contentRow.trim();

  // Required
  const name = Maybe.fromNullable(
    trimmedContentRow
      .replace(noteRegex, "")
      .replace(timeEstimateRegex, "")
      .replace(completedRegex, "")
      .trim(),
  )
    .map((x) => (x.length > 0 ? x : null))
    .toEither("Name is required")
    .chain(string.decode)
    .toMaybe();

  const note = optional(string)
    .decode(trimmedContentRow.match(noteRegex)?.[0])
    .map((x) => x?.replace(/(\(|\))/g, "").trim())
    .orDefault(undefined);

  const timeEstimate = optional(TimeEstimate)
    .decode(trimmedContentRow.match(timeEstimateRegex)?.[0])
    .orDefault(undefined);

  const completed = string
    .decode(trimmedContentRow.match(completedRegex)?.[0])
    .map(() => true)
    .orDefault(false);

  const itemId = id();

  return name.map((name) => ({
    id: itemId,
    name,
    note,
    timeEstimate,
    completed,
  }));
};

export const structureChecklistContent = (
  content: string,
): ChecklistV2Structured => {
  const sectionsRows = content.trim().replaceAll("\r", "").split("\n\n");

  const sections: ChecklistV2StructuredSection[] = [];

  for (const section of sectionsRows) {
    const rows = section.split("\n");

    const name = rows[0].trim();

    const items = Maybe.catMaybes(
      rows.slice(1).map(structureChecklistContentRow),
    );

    const sectionId = id();

    sections.push({
      id: sectionId,
      name,
      items,
    });
  }

  return {
    sections,
  };
};
