import { test } from "vitest";
import {
  checklist,
  checklistItem,
  checklistSection,
} from "@/factories/checklist.factory";
import { convertChecklistSectionsToTextContent } from "./convert-checlist-to-text";

test("Groups sections and items", ({ expect }) => {
  const checklistExample = checklist({
    sections: [
      checklistSection({ items: [checklistItem({ timeEstimate: "5m" })] }),
    ],
  });

  const checklistName = checklistExample.name;
  const checklistSectionName = checklistExample.sections[0].name;
  const { name: checklistSectionItemName, note: checklistSectionItemNote } =
    checklistExample.sections[0].items[0];

  const result = convertChecklistSectionsToTextContent(checklistExample);

  expect(result).toContain(checklistName);
  expect(result).toContain(checklistSectionName);
  expect(result).toContain(checklistSectionItemName);
  expect(result).toContain(checklistSectionItemNote);

  const expected = `${checklistName}

${checklistSectionName}
- ${checklistSectionItemName} (${checklistSectionItemNote})`;

  expect(result).toBe(expected);
});

test("returns empty string if checklist doesn't have any incompleted sections", ({
  expect,
}) => {
  const checklistExample = checklist({
    sections: [checklistSection({ items: [] })],
  });

  const checklistName = checklistExample.name;
  const checklistSectionName = checklistExample.sections[0].name;

  const result = convertChecklistSectionsToTextContent(checklistExample);

  expect(result).not.toContain(checklistName);
  expect(result).not.toContain(checklistSectionName);

  const expected = "";

  expect(result).toBe(expected);
});

test("hides sections without any items", ({ expect }) => {
  const checklistExample = checklist({
    sections: [
      checklistSection({
        name: "name a",
        items: [checklistItem({ note: undefined })],
      }),
      checklistSection({ name: "name b", items: [] }),
    ],
  });

  const checklistName = checklistExample.name;
  const {
    name: incompleteChecklistSectionName,
    items: incompleteChecklistSectionItems,
  } = checklistExample.sections[0];
  const completedChecklistSectionName = checklistExample.sections[1].name;

  const result = convertChecklistSectionsToTextContent(checklistExample);

  expect(result).toContain(checklistName);
  expect(result).toContain(incompleteChecklistSectionName);
  expect(result).not.toContain(completedChecklistSectionName);

  const expected = `${checklistName}

${incompleteChecklistSectionName}
- ${incompleteChecklistSectionItems[0].name}`;

  expect(result).toBe(expected);
});

test("hides sections if all items it contains have already been completed", ({
  expect,
}) => {
  const checklistExample = checklist({
    sections: [
      checklistSection({
        name: "name a",
        items: [checklistItem({ completed: false, note: undefined })],
      }),
      checklistSection({
        name: "name b",
        items: [checklistItem({ completed: true })],
      }),
    ],
  });

  const checklistName = checklistExample.name;
  const {
    name: incompleteChecklistSectionName,
    items: incompleteChecklistSectionItems,
  } = checklistExample.sections[0];
  const completedChecklistSectionName = checklistExample.sections[1].name;

  const result = convertChecklistSectionsToTextContent(checklistExample);

  expect(result).toContain(checklistName);
  expect(result).toContain(incompleteChecklistSectionName);
  expect(result).not.toContain(completedChecklistSectionName);

  const expected = `${checklistName}

${incompleteChecklistSectionName}
- ${incompleteChecklistSectionItems[0].name}`;

  expect(result).toBe(expected);
});

test("hides items if they've already been completed", ({ expect }) => {
  const checklistExample = checklist({
    sections: [
      checklistSection({
        items: [
          checklistItem({ name: "name a", note: "note a", completed: false }),
          checklistItem({ name: "name b", note: "note b", completed: true }),
        ],
      }),
    ],
  });

  const checklistName = checklistExample.name;
  const checklistSectionName = checklistExample.sections[0].name;

  const {
    name: incompleteChecklistSectionItemName,
    note: incompleteChecklistSectionItemNote,
  } = checklistExample.sections[0].items[0];

  const {
    name: completedChecklistSectionItemName,
    note: completedChecklistSectionItemNote,
  } = checklistExample.sections[0].items[1];

  const result = convertChecklistSectionsToTextContent(checklistExample);

  expect(result).toContain(checklistName);
  expect(result).toContain(checklistSectionName);
  expect(result).toContain(incompleteChecklistSectionItemName);
  expect(result).toContain(incompleteChecklistSectionItemNote);
  expect(result).not.toContain(completedChecklistSectionItemName);
  expect(result).not.toContain(completedChecklistSectionItemNote);

  const expected = `${checklistName}

${checklistSectionName}
- ${incompleteChecklistSectionItemName} (${incompleteChecklistSectionItemNote})`;

  expect(result).toBe(expected);
});
