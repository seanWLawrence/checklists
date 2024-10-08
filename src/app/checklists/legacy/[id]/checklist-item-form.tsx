"use client";
import Link from "next/link";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { Checklist, ChecklistItem } from "../checklist.types";
import {
  markItemsIncompleteAction,
  updateChecklistItemsAction,
} from "../checklist.model";
import { Maybe } from "purify-ts/Maybe";
import React, { useCallback, useRef, useState } from "react";
import { MenuButton } from "@/components/menu-button";
import { convertChecklistSectionsToTextContent } from "./convert-checlist-to-text";
import { TimeEstimate } from "@/lib/types";
import { TimeEstimateBadge } from "@/components/time-estimate-badge";

const filterCompletedItemsIfHidden = ({
  items,
  showCompleted,
}: {
  showCompleted: boolean;
  items: ChecklistItem[];
}): ChecklistItem[] => {
  if (!showCompleted) {
    return items.filter((x) => !x.completed);
  }

  return items;
};

const copyToClipboard = (content: string): void => {
  navigator.clipboard.writeText(content);
};

export const ChecklistItemForm: React.FC<{ checklist: Checklist }> = ({
  checklist,
}) => {
  const hasCompletedItems = checklist.sections.some((section) => {
    return section.items.some((item) => item.completed);
  });

  const formRef = useRef<HTMLFormElement | null>(null);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const toggleShowCompleted = useCallback(
    () => setShowCompleted((prev) => !prev),
    [],
  );

  return (
    <div className="space-y-4 max-w-prose">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1 items-center">
          <Heading level={1}>{checklist.name}</Heading>

          {hasCompletedItems && (
            <MenuButton
              menu={
                <div className="flex flex-col space-y-2 text-normal">
                  <form
                    action={async () => {
                      Maybe.fromNullable(formRef.current).ifJust(async (x) => {
                        const formData = new FormData(x);
                        await markItemsIncompleteAction(formData);

                        window.location.reload();
                      });
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Reset completed
                    </Button>
                  </form>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={toggleShowCompleted}
                  >
                    {showCompleted ? "Hide completed" : "Show completed"}
                  </Button>
                </div>
              }
            ></MenuButton>
          )}
        </div>

        <TimeEstimateBadge
          timeEstimates={checklist.sections.reduce((acc, x) => {
            x.items.forEach((item) => {
              if (!item.completed && item.timeEstimate) {
                acc.push(item.timeEstimate);
              }
            });
            return acc;
          }, [] as TimeEstimate[])}
        />

        <Link
          href={`/checklists/legacy/${checklist.id}/edit`}
          className="underline underline-offset-2"
        >
          <Button type="button" variant="ghost">
            Edit
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <form ref={formRef} className="space-y-4">
          <input
            type="hidden"
            value={JSON.stringify(checklist)}
            name="checklist"
          />

          {checklist.sections.map(({ id, name, items }) => {
            const filteredItems = filterCompletedItemsIfHidden({
              showCompleted,
              items,
            });

            return (
              <div key={id}>
                <fieldset className="space-y-1 border-2 border-zinc-700 px-3 pt-2 pb-3 rounded-lg w-full min-w-48">
                  <Heading
                    level="legend"
                    className="flex items-center space-x-2"
                  >
                    <span className="mr-1">{name}</span>

                    <div className="text-xs font-normal">
                      <TimeEstimateBadge
                        timeEstimates={items.reduce((acc, x) => {
                          if (!x.completed && x.timeEstimate) {
                            acc.push(x.timeEstimate);
                          }
                          return acc;
                        }, [] as TimeEstimate[])}
                      />
                    </div>
                  </Heading>

                  <div>
                    <ul className="space-y-4">
                      {items.map(
                        ({ id, name, completed, note, timeEstimate }) => {
                          // Hidden so they won't appear, but will get submitted
                          if (completed && !showCompleted) {
                            return (
                              <div className="hidden" key={id}>
                                <Checkbox
                                  defaultChecked={completed}
                                  name={`item__${id}`}
                                  note={note}
                                >
                                  {"This is hidden"}
                                </Checkbox>
                              </div>
                            );
                          }

                          return (
                            <li key={id} className="flex flex-col space-y-.5">
                              <Checkbox
                                defaultChecked={completed}
                                name={`item__${id}`}
                                note={note}
                              >
                                <div className="flex justify-between w-full">
                                  <span>{name}</span>

                                  {timeEstimate && (
                                    <TimeEstimateBadge
                                      timeEstimates={[timeEstimate]}
                                    />
                                  )}
                                </div>
                              </Checkbox>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>

                  {filteredItems.length === 0 && (
                    <p className="text-xs text-zinc-700">(No items)</p>
                  )}
                </fieldset>
              </div>
            );
          })}
        </form>

        <div className="justify-between flex">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const checklistAsText =
                convertChecklistSectionsToTextContent(checklist);

              if (!checklistAsText.length) {
                alert("Nothing to copy to clipboard. Skipping.");
                return;
              }

              copyToClipboard(checklistAsText);

              alert("Successfully copied checklist to clipboard.");
            }}
          >
            Copy to clipboard
          </Button>

          <form
            action={() => {
              Maybe.fromNullable(formRef.current).ifJust(async (x) => {
                const formData = new FormData(x);
                await updateChecklistItemsAction(formData);
              });
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
