"use client";

import { useMemo, useReducer } from "react";
import { useRouter } from "next/navigation";

import type {
  IChecklist,
  IChecklistItem,
  IChecklistSection,
} from "@/lib/types";
import { Button } from "@/components/button";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { X } from "@/components/x";
import { deleteChecklistById, onChecklistSave } from "./checklist.model";
import { checklistItem, checklistSection } from "@/factories/checklist.factory";
import { id } from "@/factories/id.factory";

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

interface ChecklistFormProps {
  variant: "new" | "edit";
  initialChecklist: IChecklist;
}

const checklistToState = (checklist: IChecklist): State => {
  const sections: State["sections"] = {};
  const items: State["items"] = {};

  checklist.sections.forEach((section) => {
    sections[section.id] = section;

    section.items.forEach((item) => {
      items[item.id] = item;
    });
  });

  return { checklist, sections, items };
};

export const ChecklistForm: React.FC<ChecklistFormProps> = ({
  initialChecklist,
  variant,
}) => {
  const router = useRouter();

  const [state, dispatch] = useReducer((state: State, action: Action) => {
    if (action.type === "CREATE_SECTION") {
      const sectionId = id();
      const itemId = id();

      return {
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: checklistSection({
            checklistId: state.checklist.id,
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
  }, checklistToState(initialChecklist));

  const itemsBySectionId = useMemo(() => {
    const bySectionId: Record<string /* sectionId */, IChecklistItem[]> = {};

    Object.values(state.items).forEach((item) => {
      const existingItems = bySectionId[item.checklistSectionId];

      bySectionId[item.checklistSectionId] = [...(existingItems || []), item];
    });

    return bySectionId;
  }, [state.items]);

  const sectionsArray = Object.values(state.sections);

  return (
    <form className="space-y-4 max-w-prose">
      <div className="flex space-x-1">
        <h1 className="text-3xl">Checklist</h1>

        {variant === "edit" && (
          <Button
            type="submit"
            formAction={async () => {
              const confirmed = window.confirm("Delete?");

              if (confirmed) {
                await deleteChecklistById(state.checklist.id);

                router.push("/checklists");
              }
            }}
          >
            <X />
          </Button>
        )}
      </div>

      <Label label="Checklist name">
        <Input
          required
          type="text"
          value={state.checklist.name}
          onChange={(e) => {
            dispatch({ type: "UPDATE_CHECKLIST", name: e.target.value });
          }}
        />
      </Label>

      {!sectionsArray.length && (
        <p className="text-zinc-700 text-xs">(No sections)</p>
      )}

      {sectionsArray.map((section) => {
        return (
          <fieldset
            key={section.id}
            className="space-y-1 border-2 border-zinc-700 px-5 py-2 rounded-lg w-full min-w-48"
          >
            <legend className="text-2xl">
              Section: {section.name || "(blank)"}{" "}
              <Button
                type="button"
                aria-label="Delete section"
                onClick={() => {
                  dispatch({ type: "DELETE_SECTION", id: section.id });
                }}
              >
                <X />
              </Button>
            </legend>

            <Label label="Section name">
              <Input
                required
                type="text"
                value={section.name}
                onChange={(e) => {
                  dispatch({
                    type: "UPDATE_SECTION",
                    id: section.id,
                    name: e.target.value,
                  });
                }}
              />
            </Label>

            <div>
              <div className="space-y-4 ml-4">
                <div className="space-y-2">
                  <h3>Items</h3>

                  {!itemsBySectionId[section.id]?.length && (
                    <p className="text-zinc-700 text-xs">(No items)</p>
                  )}

                  {itemsBySectionId[section.id]?.map((item) => {
                    return (
                      <div
                        className="flex space-x-2 items-end max-w-prose w-full"
                        key={item.id}
                      >
                        <Label label="Name">
                          <Input
                            required
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              dispatch({
                                type: "UPDATE_ITEM",
                                id: item.id,
                                name: e.target.value,
                              });
                            }}
                          />
                        </Label>

                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              dispatch({ type: "DELETE_ITEM", id: item.id });
                            }}
                            aria-label="Delete item"
                          >
                            <X />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end w-full">
                  <Button
                    onClick={() => {
                      dispatch({ type: "CREATE_ITEM", sectionId: section.id });
                    }}
                    type="button"
                    variant="outline"
                  >
                    Create item
                  </Button>
                </div>
              </div>
            </div>
          </fieldset>
        );
      })}

      <div className="w-full flex justify-between">
        <Button
          type="button"
          onClick={() => {
            dispatch({ type: "CREATE_SECTION" });
          }}
        >
          Create section
        </Button>

        <div className="space-x-2">
          {variant === "edit" && (
            <Button
              type="submit"
              variant="outline"
              formAction={async () => {
                const name = window.prompt("New name?");

                if (name) {
                  const checklistId = id();

                  const checklist: IChecklist = {
                    ...state.checklist,
                    id: checklistId,
                    name,
                    sections: Object.values(state.sections).map((section) => {
                      return {
                        ...section,
                        checklistId,
                        items: Object.values(
                          itemsBySectionId[section.id] ?? {},
                        ),
                      };
                    }),
                  };

                  await onChecklistSave({ variant, checklist });

                  const checklistIdPath = `/checklists/${checklist.id}`;

                  router.push(checklistIdPath);
                }
              }}
            >
              Duplicate
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            formAction={async () => {
              const checklist: IChecklist = {
                ...state.checklist,
                sections: Object.values(state.sections).map((section) => {
                  return {
                    ...section,
                    items: Object.values(itemsBySectionId[section.id] ?? {}),
                  };
                }),
              };

              await onChecklistSave({ variant, checklist });

              const checklistIdPath = `/checklists/${checklist.id}`;

              router.push(checklistIdPath);
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  );
};
