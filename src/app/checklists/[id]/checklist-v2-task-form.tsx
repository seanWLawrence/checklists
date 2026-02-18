"use client";
import { Button } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import {
  ChecklistV2,
  ChecklistV2Structured,
  ChecklistV2StructuredItem,
  TimeEstimate,
} from "../checklist-v2.types";
import { Maybe } from "purify-ts/Maybe";
import React, { useCallback, useRef, useState } from "react";
import { MenuButton } from "@/components/menu-button";
import { TimeEstimateBadge } from "@/components/time-estimate-badge";
import { updateChecklistV2Action } from "../actions/update-checklist-v2.action";
import { RelativeTime } from "@/components/relative-time";
import { LinkButton } from "@/components/link-button";
import { updateChecklistV2SharedAction } from "../actions/update-checklist-v2-shared.action";
import { useChecklistPolling } from "./hooks/useChecklistPolling";
import { useChecklistDebouncedAutosave } from "./hooks/useChecklistDebouncedAutosave";
import { Fieldset } from "@/components/fieldset";

const POLLING_INTERVAL_IN_MILLI = 5000;
const AUTO_SAVE_DELAY_IN_MILLI = 1000;

const filterCompletedItemsIfHidden = ({
  items,
  showCompleted,
}: {
  showCompleted: boolean;
  items: ChecklistV2StructuredItem[];
}): ChecklistV2StructuredItem[] => {
  if (!showCompleted) {
    return items.filter((x) => !x.completed);
  }

  return items;
};

export const ChecklistV2TaskForm: React.FC<{
  structuredChecklist: ChecklistV2Structured &
    Pick<ChecklistV2, "id" | "name" | "updatedAtIso">;
  shareAccess?: { token: string };
  pollingIntervalMs?: number;
}> = ({ structuredChecklist, shareAccess }) => {
  const [currentChecklist, setCurrentChecklist] = useState(structuredChecklist);

  const hasCompletedItems = currentChecklist.sections.some((section) => {
    return section.items.some((item) => item.completed);
  });

  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const toggleShowCompleted = useCallback(
    () => setShowCompleted((prev) => !prev),
    [],
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  /**
   * Holds the active debounce timer.
   * If it’s non‑null, it means “a save is scheduled but hasn’t started yet.”
   */
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { debouncedAutosave } = useChecklistDebouncedAutosave({
    delayMs: AUTO_SAVE_DELAY_IN_MILLI,
    formRef,
    saveTimeoutRef,
    shareAccess,
  });

  useChecklistPolling({
    checklistId: currentChecklist.id,
    shareAccess,
    pollingIntervalMs: POLLING_INTERVAL_IN_MILLI,
    saveTimeoutRef,
    setCurrentChecklist,
  });

  return (
    <div className="space-y-4 max-w-prose">
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 items-center">
            <Heading level={1}>{currentChecklist.name}</Heading>

            {hasCompletedItems && (
              <MenuButton
                menu={
                  <div className="flex flex-col space-y-2 text-normal">
                    <form
                      action={async () => {
                        Maybe.fromNullable(formRef.current).ifJust(
                          async (x) => {
                            const formData = new FormData(x);

                            for (const [key, value] of Array.from(
                              formData.entries(),
                            )) {
                              if (key.startsWith("item__") && value === "on") {
                                formData.set(key, "off");
                              }
                            }

                            if (shareAccess) {
                              await updateChecklistV2SharedAction(formData);
                            } else {
                              await updateChecklistV2Action(formData);
                            }
                          },
                        );
                      }}
                    >
                      <SubmitButton type="submit" variant="ghost">
                        Reset completed
                      </SubmitButton>
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
            timeEstimates={currentChecklist.sections.reduce((acc, x) => {
              x.items.forEach((item) => {
                if (!item.completed && item.timeEstimate) {
                  acc.push(item.timeEstimate);
                }
              });
              return acc;
            }, [] as TimeEstimate[])}
          />

          {!shareAccess && (
            <LinkButton
              href={`/checklists/${currentChecklist.id}/edit`}
              variant="ghost"
              className="underline underline-offset-2"
            >
              Edit
            </LinkButton>
          )}
        </div>

        <RelativeTime date={currentChecklist.updatedAtIso} />
      </div>

      <div className="space-y-4">
        <form ref={formRef} className="space-y-4">
          <input
            type="hidden"
            value={JSON.stringify(currentChecklist)}
            name="checklist"
          />

          <input type="hidden" value={currentChecklist.name} name="name" />
          {shareAccess && (
            <>
              <input
                type="hidden"
                name="shareToken"
                value={shareAccess.token}
              />
              <input
                type="hidden"
                name="checklistId"
                value={currentChecklist.id}
              />
            </>
          )}

          {currentChecklist.sections.map(({ id, name, items }) => {
            const filteredItems = filterCompletedItemsIfHidden({
              showCompleted,
              items,
            });

            return (
              <div key={`${id}-${currentChecklist.updatedAtIso.toISOString()}`}>
                <Fieldset
                  legend={
                    <>
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
                    </>
                  }
                >
                  <div>
                    <ul className="space-y-3">
                      {items.map(
                        ({ id, name, completed, note, timeEstimate }) => {
                          // Hidden so they won't appear, but will get submitted
                          if (completed && !showCompleted) {
                            return (
                              <div
                                className="hidden"
                                key={`${id}-${currentChecklist.updatedAtIso.toISOString()}`}
                              >
                                <Checkbox
                                  defaultChecked={completed}
                                  name={`item__${id}`}
                                  note={note}
                                  onChange={debouncedAutosave}
                                >
                                  {"This is hidden"}
                                </Checkbox>
                              </div>
                            );
                          }

                          return (
                            <li
                              key={`${id}-${currentChecklist.updatedAtIso.toISOString()}`}
                              className="flex flex-col space-y-.5"
                            >
                              <Checkbox
                                defaultChecked={completed}
                                name={`item__${id}`}
                                note={note}
                                onChange={debouncedAutosave}
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
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      (No items)
                    </p>
                  )}
                </Fieldset>
              </div>
            );
          })}

          <input
            name="metadata"
            type="hidden"
            value={JSON.stringify(currentChecklist)}
            readOnly
            required
          />
        </form>
      </div>
    </div>
  );
};
