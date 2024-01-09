"use client";

import { useReducer } from "react";
import {
  checklist,
  checklistItem,
  checklistSection,
} from "@/factories/checklist.factory";
import { id } from "@/factories/id.factory";
import { IChecklist, IChecklistItem, IChecklistSection } from "@/lib/types";
import { ChecklistForm } from "../checklist-form";

const initialChecklistId = id();
const initialSectionId = id();
const initialItemId = id();

interface State {
  checklist: Omit<IChecklist, "items" | "sections">;
  sections: Record<string /* sectionId */, Omit<IChecklistSection, "items">>;
  items: Record<string /* itemId */, IChecklistItem>;
}

type Action =
  | { type: "UPDATE_CHECKLIST"; name: string }
  | { type: "CREATE_SECTION" }
  | { type: "CREATE_ITEM"; sectionId: string }
  | { type: "UPDATE_SECTION"; id: string; name: string }
  | { type: "UPDATE_ITEM"; id: string; name: string }
  | { type: "DELETE_SECTION"; id: string }
  | { type: "DELETE_ITEM"; id: string };

const NewChecklist: React.FC<{}> = () => {
  const [state, dispatch] = useReducer(
    (state: State, action: Action) => {
      if (action.type === "CREATE_SECTION") {
        const sectionId = id();
        const itemId = id();

        return {
          ...state,
          sections: {
            ...state.sections,
            [sectionId]: checklistSection({
              checklistId: initialChecklistId,
              id: sectionId,
              name: "",
            }),
          },
          items: {
            ...state.items,
            [itemId]: checklistItem({
              id: itemId,
              checklistSectionId: sectionId,
              name: "",
            }),
          },
        } satisfies State;
      }

      if (action.type === "CREATE_ITEM") {
        const itemId = id();

        return {
          ...state,
          items: {
            ...state.items,
            [itemId]: checklistItem({
              id: itemId,
              checklistSectionId: action.sectionId,
              name: "",
            }),
          },
        } satisfies State;
      }

      if (action.type === "UPDATE_CHECKLIST") {
        return {
          ...state,
          checklist: { ...state.checklist, name: action.name },
        };
      }

      if (action.type === "UPDATE_SECTION") {
        const existingSection = state.sections[action.id];

        if (existingSection) {
          return {
            ...state,
            sections: {
              ...state.sections,
              [action.id]: { ...existingSection, name: action.name },
            },
          } satisfies State;
        }

        return state;
      }

      if (action.type === "UPDATE_ITEM") {
        const existingItem = state.items[action.id];

        if (existingItem) {
          return {
            ...state,
            items: {
              ...state.items,
              [action.id]: {
                ...existingItem,
                name: action.name,
              },
            },
          } satisfies State;
        }

        return state;
      }

      if (action.type === "DELETE_SECTION") {
        const items: Record<string, IChecklistItem> = {};

        Object.values(state.items).forEach((item) => {
          if (item.checklistSectionId !== action.id) {
            items[item.id] = item;
          }
        });

        const sections = { ...state.sections };
        delete sections[action.id];

        return {
          ...state,
          sections,
          items,
        } satisfies State;
      }

      if (action.type === "DELETE_ITEM") {
        const items = { ...state.items };
        delete items[action.id];

        return {
          ...state,
          items,
        } satisfies State;
      }

      return state;
    },
    {
      checklist: checklist({ name: "", id: initialChecklistId }),
      sections: {
        [initialSectionId]: checklistSection({
          name: "",
          id: initialSectionId,
          checklistId: initialChecklistId,
        }),
      },
      items: {
        [initialItemId]: checklistItem({
          name: "",
          id: initialItemId,
          checklistSectionId: initialSectionId,
        }),
      },
    },
  );

  return (
    <ChecklistForm
      checklist={state.checklist}
      sections={state.sections}
      items={state.items}
      onCreateSection={() => {
        dispatch({ type: "CREATE_SECTION" });
      }}
      onCreateItem={({ sectionId }) => {
        dispatch({ type: "CREATE_ITEM", sectionId });
      }}
      onUpdateChecklist={({ name }) => {
        dispatch({ type: "UPDATE_CHECKLIST", name });
      }}
      onUpdateSection={({ name, id }) => {
        dispatch({ type: "UPDATE_SECTION", name, id });
      }}
      onUpdateItem={({ name, id }) => {
        dispatch({ type: "UPDATE_ITEM", name, id });
      }}
      onDeleteSection={({ id }) => {
        dispatch({ type: "DELETE_SECTION", id });
      }}
      onDeleteItem={({ id }) => {
        dispatch({ type: "DELETE_ITEM", id });
      }}
    />
  );
};

export default NewChecklist;
