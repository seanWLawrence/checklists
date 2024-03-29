"use client";

import { useCallback, useMemo, useReducer, useTransition } from "react";
import { useRouter } from "next/navigation";

import type {
  Checklist,
  ChecklistItem,
  ChecklistSection,
  UUID,
} from "@/lib/types";
import { Button } from "@/components/button";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { TrashIcon } from "@/components/icons/trash-icon";
import {
  createChecklistAction,
  deleteChecklistAction,
  updateChecklistAction,
} from "./checklist.model";
import { checklistItem, checklistSection } from "@/factories/checklist.factory";
import { id } from "@/factories/id.factory";
import { cn } from "@/lib/utils";
import { MenuButton } from "@/components/menu-button";
import { Heading } from "@/components/heading";
import { Maybe } from "purify-ts/Maybe";
import { NonEmptyList } from "purify-ts";

interface State {
  checklist: Omit<Checklist, "sections">;
  sections: Record<string /* sectionId */, Omit<ChecklistSection, "items">>;
  items: Record<string /* itemId */, ChecklistItem>;
}

type Action =
  | { type: "UPDATE_CHECKLIST"; name: string }
  | { type: "CREATE_SECTION" }
  | { type: "CREATE_ITEM"; sectionId: UUID; itemId: UUID }
  | { type: "UPDATE_SECTION"; id: UUID; name: string }
  | {
      type: "UPDATE_ITEM";
      id: UUID;
      value: string;
      property: "name" | "note" | "timeEstimate";
    }
  | { type: "DELETE_SECTION"; id: UUID }
  | { type: "DELETE_ITEM"; id: UUID }
  | { type: "CLEAR_ITEMS" }
  | { type: "CLEAR_COMPLETED_ITEMS" };

interface ChecklistFormProps {
  variant: "new" | "edit";
  initialChecklist: Checklist;
}

const checklistToState = (checklist: Checklist): State => {
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
  const [, startTransition] = useTransition();
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
              id: sectionId,
              name: "",
            }),
          },
        } satisfies State;
      }

      if (action.type === "CREATE_ITEM") {
        const itemId = action.itemId;

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
        const items: Record<string, ChecklistItem> = {};

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

      if (action.type === "CLEAR_ITEMS") {
        return { ...state, items: {} };
      }

      if (action.type === "CLEAR_COMPLETED_ITEMS") {
        return {
          ...state,
          items: Object.entries(state.items).reduce(
            (acc: State["items"], [id, item]) => {
              if (!item.completed) {
                acc[id] = item;
              }

              return acc;
            },
            {},
          ),
        };
      }

      return state;
    },
    { ...checklistToState(initialChecklist) },
  );

  const itemsBySectionId = useMemo(() => {
    const bySectionId: Record<string /* sectionId */, ChecklistItem[]> = {};

    Object.values(state.items).forEach((item) => {
      const existingItems = bySectionId[item.checklistSectionId];

      bySectionId[item.checklistSectionId] = [...(existingItems || []), item];
    });

    return bySectionId;
  }, [state.items]);

  const onCreateItem = useCallback(
    ({ sectionId, itemId }: { sectionId: UUID; itemId: UUID }) => {
      startTransition(() => {
        dispatch({
          type: "CREATE_ITEM",
          sectionId,
          itemId,
        });

        setTimeout(() => {
          Maybe.fromNullable(document.getElementsByName(`item__${itemId}`))
            .chain(($els) => NonEmptyList.fromArray(Array.from($els)))
            .map(($els) => NonEmptyList.head($els))
            .ifJust(($el) => $el.focus());
        }, 50);
      });
    },
    [],
  );

  const sectionsArray = Object.values(state.sections);
  const hasItems = Object.values(state.items).length;
  const shouldShowMenuButton = hasItems || variant === "edit";

  return (
    <div className="space-y-4 max-w-prose">
      <div className="flex space-x-2 items-center">
        <Heading level={1}>{state.checklist.name || "(blank)"}</Heading>

        {shouldShowMenuButton && (
          <MenuButton
            variant="ghost"
            menu={
              <div className="flex flex-col space-y-2">
                {hasItems ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        startTransition(() =>
                          dispatch({ type: "CLEAR_ITEMS" }),
                        );
                      }}
                    >
                      Clear items
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        startTransition(() =>
                          dispatch({ type: "CLEAR_COMPLETED_ITEMS" }),
                        );
                      }}
                    >
                      Clear completed items
                    </Button>
                  </>
                ) : null}

                {variant === "edit" && (
                  <form
                    action={async () => {
                      const name = window.prompt("New name?");

                      if (name) {
                        const checklistId = id();

                        const checklist: Checklist = {
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

                        await createChecklistAction(checklist);
                      }
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Duplicate
                    </Button>
                  </form>
                )}

                {variant === "edit" && (
                  <form
                    action={async () => {
                      const confirmed = window.confirm("Delete?");

                      if (confirmed) {
                        await deleteChecklistAction(state.checklist);

                        router.push("/checklists");
                      }
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Delete
                    </Button>
                  </form>
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
            className="space-y-1 border-2 border-zinc-700 px-3 py-2 rounded-lg w-full min-w-48 animate-in fade-in duration-300"
          >
            <Heading level="legend" className="flex space-x-2">
              <span>{section.name || "(blank)"}</span>

              <Button
                type="button"
                variant="ghost"
                aria-label="Delete section"
                onClick={() => {
                  startTransition(() =>
                    dispatch({ type: "DELETE_SECTION", id: section.id }),
                  );
                }}
              >
                <TrashIcon />
              </Button>
            </Heading>

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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Heading level={3} className="mt-3">
                    <span>Items</span>
                  </Heading>

                  {!itemsBySectionId[section.id]?.length && (
                    <p className="text-zinc-700 text-xs">(No items)</p>
                  )}

                  {itemsBySectionId[section.id]?.map((item) => {
                    return (
                      <div
                        className="flex items-start space-x-1 max-w-prose w-full animate-in fade-in duration-300"
                        key={item.id}
                      >
                        <div className="flex flex-col space-y-2 w-full">
                          <Input
                            required
                            type="text"
                            value={item.name}
                            name={`item__${item.id}`}
                            onChange={(e) => {
                              dispatch({
                                type: "UPDATE_ITEM",
                                id: item.id,
                                value: e.target.value,
                                property: "name",
                              });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();

                                const itemId = id();

                                onCreateItem({
                                  sectionId: section.id,
                                  itemId,
                                });
                              }
                            }}
                            placeholder="Name"
                          />

                          <div className="flex space-x-1">
                            <Input
                              className={cn(
                                "animate-in fade-in duration-300 max-w-14",
                              )}
                              type="text"
                              value={item.timeEstimate ?? ""}
                              onChange={(e) => {
                                dispatch({
                                  type: "UPDATE_ITEM",
                                  id: item.id,
                                  value: e.target.value,
                                  property: "timeEstimate",
                                });
                              }}
                              placeholder="Time"
                            />

                            <Input
                              className={cn("animate-in fade-in duration-300")}
                              type="text"
                              value={item.note ?? ""}
                              onChange={(e) => {
                                dispatch({
                                  type: "UPDATE_ITEM",
                                  id: item.id,
                                  value: e.target.value,
                                  property: "note",
                                });
                              }}
                              placeholder="Note"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            startTransition(() =>
                              dispatch({
                                type: "DELETE_ITEM",
                                id: item.id,
                              }),
                            );
                          }}
                          aria-label={`Delete ${item.name}`}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end w-full">
                  <Button
                    onClick={() => {
                      onCreateItem({ sectionId: section.id, itemId: id() });
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
              startTransition(() => dispatch({ type: "CREATE_SECTION" }));
            }}
          >
            Create section
          </Button>
        </div>

        <div className="flex space-x-2">
          <form
            action={async () => {
              const checklist: Checklist = {
                ...state.checklist,
                sections: Object.values(state.sections).map((section) => {
                  return {
                    ...section,
                    items: Object.values(itemsBySectionId[section.id] ?? {}),
                  };
                }),
              };

              if (variant === "new") {
                await createChecklistAction(checklist);
              } else {
                await updateChecklistAction(checklist);
              }
            }}
          >
            <Button type="submit" variant="primary">
              Save
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
