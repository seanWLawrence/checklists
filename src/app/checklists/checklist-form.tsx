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
import { TrashIcon } from "@/components/icons/trash-icon";
import { deleteChecklistById, onChecklistSave } from "./checklist.model";
import { checklistItem, checklistSection } from "@/factories/checklist.factory";
import { id } from "@/factories/id.factory";
import { ExpandIcon } from "@/components/icons/expand-icon";
import { cn } from "@/lib/utils";
import { MenuButton } from "@/components/menu-button";

interface State {
  checklist: Omit<IChecklist, "items" | "sections">;
  sections: Record<string /* sectionId */, Omit<IChecklistSection, "items">>;
  items: Record<string /* itemId */, IChecklistItem>;
  expandedForNotes: boolean;
}

type Action =
  | { type: "UPDATE_CHECKLIST"; name: string }
  | { type: "CREATE_SECTION" }
  | { type: "CREATE_ITEM"; sectionId: string }
  | { type: "UPDATE_SECTION"; id: string; name: string }
  | {
      type: "UPDATE_ITEM";
      id: string;
      value: string;
      property: "name" | "note";
    }
  | { type: "DELETE_SECTION"; id: string }
  | { type: "DELETE_ITEM"; id: string }
  | { type: "TOGGLE_EXPANDED_FOR_NOTES" }
  | { type: "CLEAR_ITEMS" };

interface ChecklistFormProps {
  variant: "new" | "edit";
  initialChecklist: IChecklist;
}

const checklistToState = (
  checklist: IChecklist,
): Omit<State, "expandedForNotes"> => {
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

  const [state, dispatch] = useReducer(
    (state: State, action: Action) => {
      if (action.type === "CREATE_SECTION") {
        const sectionId = id();

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
              note: "",
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
                [action.property]: action.value,
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

      if (action.type === "TOGGLE_EXPANDED_FOR_NOTES") {
        return { ...state, expandedForNotes: !state.expandedForNotes };
      }

      if (action.type === "CLEAR_ITEMS") {
        return { ...state, items: {} };
      }

      return state;
    },
    { ...checklistToState(initialChecklist), expandedForNotes: false },
  );

  const itemsBySectionId = useMemo(() => {
    const bySectionId: Record<string /* sectionId */, IChecklistItem[]> = {};

    Object.values(state.items).forEach((item) => {
      const existingItems = bySectionId[item.checklistSectionId];

      bySectionId[item.checklistSectionId] = [...(existingItems || []), item];
    });

    return bySectionId;
  }, [state.items]);

  const sectionsArray = Object.values(state.sections);
  const hasItems = Object.values(state.items).length;
  const shouldShowMenuButton = hasItems || variant === "edit";

  return (
    <form className="space-y-4 max-w-prose">
      <div className="flex space-x-2 items-center">
        <h1 className="text-3xl">Checklist</h1>

        {shouldShowMenuButton && (
          <MenuButton
            variant="ghost"
            menu={
              <div className="flex flex-col space-y-2">
                {hasItems ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      dispatch({ type: "CLEAR_ITEMS" });
                    }}
                  >
                    Clear items
                  </Button>
                ) : null}

                {variant === "edit" && (
                  <Button
                    type="submit"
                    variant="ghost"
                    formAction={async () => {
                      const name = window.prompt("New name?");

                      if (name) {
                        const checklistId = id();

                        const checklist: IChecklist = {
                          ...state.checklist,
                          id: checklistId,
                          name,
                          sections: Object.values(state.sections).map(
                            (section) => {
                              return {
                                ...section,
                                checklistId,
                                items: Object.values(
                                  itemsBySectionId[section.id] ?? {},
                                ),
                              };
                            },
                          ),
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

                {variant === "edit" && (
                  <div>
                    <Button
                      type="submit"
                      variant="ghost"
                      formAction={async () => {
                        const confirmed = window.confirm("Delete?");

                        if (confirmed) {
                          await deleteChecklistById(state.checklist.id);

                          router.push("/checklists");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            }
          />
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
            <legend className="flex text-2xl space-x-2">
              <span>Section: {section.name || "(blank)"}</span>
              <Button
                type="button"
                variant="ghost"
                aria-label="Delete section"
                onClick={() => {
                  dispatch({ type: "DELETE_SECTION", id: section.id });
                }}
              >
                <TrashIcon />
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
                  <h3 className="mt-2 text-lg flex space-x-2">
                    <span>Items</span>

                    {itemsBySectionId[section.id]?.length && (
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          dispatch({ type: "TOGGLE_EXPANDED_FOR_NOTES" });
                        }}
                      >
                        <ExpandIcon />
                      </Button>
                    )}
                  </h3>

                  {!itemsBySectionId[section.id]?.length && (
                    <p className="text-zinc-700 text-xs">(No items)</p>
                  )}

                  {itemsBySectionId[section.id]?.map((item, index) => {
                    return (
                      <div
                        className="flex items-start space-x-2 max-w-prose w-full"
                        key={item.id}
                      >
                        <div className="flex flex-col space-y-2 w-full">
                          <Label label={`Name: ${index + 1}`}>
                            <Input
                              required
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                dispatch({
                                  type: "UPDATE_ITEM",
                                  id: item.id,
                                  value: e.target.value,
                                  property: "name",
                                });
                              }}
                            />
                          </Label>

                          <Label
                            label={`Note ${index + 1}`}
                            className={cn("ml-4 w-[calc(100%-1rem)]", {
                              hidden: !state.expandedForNotes,
                            })}
                          >
                            <Input
                              type="text"
                              value={item.note}
                              onChange={(e) => {
                                dispatch({
                                  type: "UPDATE_ITEM",
                                  id: item.id,
                                  value: e.target.value,
                                  property: "note",
                                });
                              }}
                            />
                          </Label>
                        </div>

                        <div className="mt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              dispatch({
                                type: "DELETE_ITEM",
                                id: item.id,
                              });
                            }}
                            aria-label="Delete item"
                          >
                            <TrashIcon />
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
        <div>
          <Button
            type="button"
            onClick={() => {
              dispatch({ type: "CREATE_SECTION" });
            }}
          >
            Create section
          </Button>
        </div>

        <div className="flex space-x-2">
          <div>
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
      </div>
    </form>
  );
};
