import { test } from "vitest";
import { checklistV2TaskFormToContent } from "./checklist-v2-task-form-to-content";
import { id } from "@/factories/id.factory";
import { UUID } from "@/lib/types";
import { ChecklistV2Structured } from "../checklist-v2.types";

test("converts", ({ expect }) => {
  const checklist: ChecklistV2Structured = {
    sections: [
      {
        id: id(),
        name: "section a",
        items: [
          {
            id: id(),
            name: "item a",
            timeEstimate: "5m",
            note: "some note",
            completed: false,
          },
          {
            id: id(),
            name: "item b",
            timeEstimate: "5m",
            note: "some note",
            completed: false,
          },
          {
            id: id(),
            name: "item c",
            note: "some note",
            completed: false,
            timeEstimate: undefined,
          },
          {
            id: id(),
            name: "item d",
            note: "some note",
            completed: false,
            timeEstimate: undefined,
          },
          {
            id: id(),
            name: "item e",
            timeEstimate: "10m",
            completed: false,
            note: undefined,
          },
          {
            id: id(),
            name: "item f",
            timeEstimate: "10m",
            completed: false,
            note: undefined,
          },
        ],
      },
      {
        id: id(),
        name: "section b",
        items: [
          {
            id: id(),
            name: "item g",
            timeEstimate: "5m",
            note: "some note",
            completed: false,
          },
          {
            id: id(),
            name: "item h",
            timeEstimate: "5m",
            note: "some note",
            completed: false,
          },
          {
            id: id(),
            name: "item i",
            note: "some note",
            completed: false,
            timeEstimate: undefined,
          },
          {
            id: id(),
            name: "item j",
            note: "some note",
            completed: false,
            timeEstimate: undefined,
          },
          {
            id: id(),
            name: "item k",
            timeEstimate: "10m",
            completed: false,
            note: undefined,
          },
          {
            id: id(),
            name: "item l",
            timeEstimate: "10m",
            completed: false,
            note: undefined,
          },
        ],
      },
    ],
  };

  const getIsCompleted = (itemId: UUID): boolean => {
    switch (itemId) {
      case checklist.sections[0].items[0].id:
        return true;
      case checklist.sections[0].items[1].id:
        return false;

      case checklist.sections[0].items[2].id:
        return true;
      case checklist.sections[0].items[3].id:
        return false;

      case checklist.sections[0].items[4].id:
        return true;
      case checklist.sections[0].items[5].id:
        return false;

      case checklist.sections[1].items[0].id:
        return true;
      case checklist.sections[1].items[1].id:
        return false;

      case checklist.sections[1].items[2].id:
        return true;
      case checklist.sections[1].items[3].id:
        return false;

      case checklist.sections[1].items[4].id:
        return true;
      case checklist.sections[1].items[5].id:
        return false;

      default:
        throw new Error("unreachable");
    }
  };

  let expected = "";

  expected += "section a";
  expected += "\n";
  expected += "--item a (some note) 5m";
  expected += "\n";
  expected += "item b (some note) 5m";
  expected += "\n";
  expected += "--item c (some note)";
  expected += "\n";
  expected += "item d (some note)";
  expected += "\n";
  expected += "--item e 10m";
  expected += "\n";
  expected += "item f 10m";

  expected += "\n";
  expected += "\n";

  expected += "section b";
  expected += "\n";
  expected += "--item g (some note) 5m";
  expected += "\n";
  expected += "item h (some note) 5m";
  expected += "\n";
  expected += "--item i (some note)";
  expected += "\n";
  expected += "item j (some note)";
  expected += "\n";
  expected += "--item k 10m";
  expected += "\n";
  expected += "item l 10m";

  expect(checklistV2TaskFormToContent({ checklist, getIsCompleted })).toBe(
    expected,
  );
});
