import { test } from "vitest";
import {
  getContextFromItemName,
  getItemNameWithoutContext,
  groupItemsByContext,
  groupNextActionsByContext,
} from "./checklist-contexts";

test("extracts one normalized context from an item", ({ expect }) => {
  expect(getContextFromItemName({ name: "Install Fireplace @Home" })).toBe(
    "@home",
  );
  expect(getContextFromItemName({ name: "Email alex@example.com" })).toBe(
    undefined,
  );
});

test("removes the context only for the context view label", ({ expect }) => {
  expect(getItemNameWithoutContext({ name: "Install Fireplace @home" })).toBe(
    "Install Fireplace",
  );
});

test("groups one next action per project and context, with untagged actions last", ({
  expect,
}) => {
  const sections = groupNextActionsByContext({
    sections: [
      {
        name: "Home Improvement",
        items: [
          {
            id: "7426d8cc-c49d-4add-9c60-7e2d4dae210a",
            name: "Install Fireplace",
            context: "@home",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
          },
          {
            id: "1a3a6a36-3426-4ac7-8c36-3e26fcd36477",
            name: "Buy grout",
            context: "@home",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
          },
          {
            id: "836b03fa-7d5f-4d61-aef1-f5f46c4bb3d6",
            name: "Choose tile",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
            context: undefined,
          },
          {
            id: "78e72800-5c48-462e-964f-fbdd76c7d9d1",
            name: "Choose paint",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
            context: undefined,
          },
        ],
      },
      {
        name: "Household Admin",
        items: [
          {
            id: "3d2ea39b-0402-4c09-867a-889c243d6f44",
            name: "File receipt",
            context: "@home",
            completed: true,
            note: undefined,
            timeEstimate: undefined,
          },
          {
            id: "e84ca4e3-849f-4352-b260-1adc6607c2ae",
            name: "Schedule repair",
            context: "@home",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
          },
        ],
      },
    ],
  });

  expect(sections).toMatchObject([
    {
      name: "@home",
      items: [
        { name: "Install Fireplace", sectionName: "Home Improvement" },
        { name: "Schedule repair", sectionName: "Household Admin" },
      ],
    },
    {
      name: "@none",
      items: [{ name: "Choose tile", sectionName: "Home Improvement" }],
    },
  ]);
});

test("groups all items within each context", ({ expect }) => {
  const sections = groupItemsByContext({
    sections: [
      {
        name: "Home Improvement",
        items: [
          {
            id: "17a1e42f-a4af-4200-a3c2-59e8f254cb97",
            name: "Install Fireplace",
            context: "@home",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
          },
          {
            id: "50ee6afb-2413-47d2-b151-44e43c69de0c",
            name: "Buy grout",
            context: "@home",
            completed: false,
            note: undefined,
            timeEstimate: undefined,
          },
        ],
      },
    ],
  });

  expect(sections).toMatchObject([
    {
      name: "@home",
      items: [{ name: "Install Fireplace" }, { name: "Buy grout" }],
    },
  ]);
});
