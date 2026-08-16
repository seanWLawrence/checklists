"use client";
import { Button } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import {
  ChecklistV2,
  ChecklistV2Structured,
  ChecklistViewMode,
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
import {
  groupItemsByContext,
  groupNextActionsByContext,
} from "./checklist-contexts";
import { updateChecklistViewModeAction } from "../actions/update-checklist-view-mode.action";
import { ChecklistItemGroup } from "../components/checklist-item-group";
import { useUnsavedChangesConfirmation } from "@/hooks/use-unsaved-changes-confirmation";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";

const POLLING_INTERVAL_IN_MILLI = 5000;
const AUTO_SAVE_DELAY_IN_MILLI = 1000;
const GROUP_BY_LABELS: Record<ChecklistViewMode, string> = {
  "group-by-section": "Section",
  "group-by-context": "Context",
  "group-by-next-action": "Next action",
};

export const ChecklistV2TaskForm: React.FC<{
  structuredChecklist: ChecklistV2Structured &
    Pick<ChecklistV2, "id" | "name" | "updatedAtIso" | "viewMode">;
  shareAccess?: { token: string };
  pollingIntervalMs?: number;
}> = ({ structuredChecklist, shareAccess }) => {
  const [currentChecklist, setCurrentChecklist] = useState(structuredChecklist);

  const hasCompletedItems = currentChecklist.sections.some((section) => {
    return section.items.some((item) => item.completed);
  });

  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ChecklistViewMode>(
    structuredChecklist.viewMode ?? "group-by-section",
  );

  const toggleShowCompleted = useCallback(
    () => setShowCompleted((prev) => !prev),
    [],
  );

  const changeViewMode = useCallback(
    (nextViewMode: ChecklistViewMode) => {
      setViewMode(nextViewMode);
      setCurrentChecklist((previousChecklist) => ({
        ...previousChecklist,
        viewMode: nextViewMode,
      }));

      if (!shareAccess) {
        void updateChecklistViewModeAction({
          checklistId: currentChecklist.id,
          viewMode: nextViewMode,
        });
      }
    },
    [currentChecklist.id, shareAccess],
  );

  const contextSections = groupItemsByContext({
    sections: currentChecklist.sections,
  });
  const nextActionContextSections = groupNextActionsByContext({
    sections: currentChecklist.sections,
  });

  const formRef = useRef<HTMLFormElement | null>(null);
  const hasPendingSaveRef = useRef(false);
  const onSaveCompleted = useCallback(() => {
    hasPendingSaveRef.current = false;
  }, []);
  /**
   * Holds the active debounce timer.
   * If it’s non‑null, it means “a save is scheduled but hasn’t started yet.”
   */
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { debouncedAutosave } = useChecklistDebouncedAutosave({
    delayMs: AUTO_SAVE_DELAY_IN_MILLI,
    formRef,
    onSaveCompleted,
    saveTimeoutRef,
    shareAccess,
  });

  const onChecklistChange = useCallback(() => {
    hasPendingSaveRef.current = true;
    debouncedAutosave();
  }, [debouncedAutosave]);

  const getHasPendingSave = useCallback(
    () => hasPendingSaveRef.current,
    [],
  );

  useUnsavedChangesConfirmation({
    formRef,
    getIsDirty: getHasPendingSave,
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

          <div aria-label="Checklist grouping">
            <MenuButton
              icon={<ChevronDownIcon />}
              variant="ghost"
              className="px-2 py-1"
              menu={
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant={
                      viewMode === "group-by-section" ? "primary" : "ghost"
                    }
                    aria-pressed={viewMode === "group-by-section"}
                    onClick={() => changeViewMode("group-by-section")}
                  >
                    Section
                  </Button>
                  <Button
                    type="button"
                    variant={
                      viewMode === "group-by-context" ? "primary" : "ghost"
                    }
                    aria-pressed={viewMode === "group-by-context"}
                    onClick={() => changeViewMode("group-by-context")}
                  >
                    Context
                  </Button>
                  <Button
                    type="button"
                    variant={
                      viewMode === "group-by-next-action" ? "primary" : "ghost"
                    }
                    aria-pressed={viewMode === "group-by-next-action"}
                    onClick={() => changeViewMode("group-by-next-action")}
                  >
                    Next action
                  </Button>
                </div>
              }
            >
              {`Group by: ${GROUP_BY_LABELS[viewMode]}`}
            </MenuButton>
          </div>

          {viewMode === "group-by-section" &&
            currentChecklist.sections.map(({ id, name, items }) => (
              <ChecklistItemGroup
                key={id}
                groupId={id}
                name={name}
                items={items}
                groupBy="section"
                showCompleted={showCompleted}
                updatedAtIso={currentChecklist.updatedAtIso}
                onChange={onChecklistChange}
              />
            ))}

          {viewMode === "group-by-next-action" &&
            nextActionContextSections.map(({ name, items }) => (
              <ChecklistItemGroup
                key={name}
                groupId={name}
                name={name}
                items={items}
                groupBy="context"
                showCompleted={showCompleted}
                updatedAtIso={currentChecklist.updatedAtIso}
                onChange={onChecklistChange}
              />
            ))}

          {viewMode === "group-by-context" &&
            contextSections.map(({ name, items }) => (
              <ChecklistItemGroup
                key={name}
                groupId={name}
                name={name}
                items={items}
                groupBy="context"
                showCompleted={showCompleted}
                updatedAtIso={currentChecklist.updatedAtIso}
                onChange={onChecklistChange}
              />
            ))}

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
