import { Checkbox } from "@/components/checkbox";
import { Fieldset } from "@/components/fieldset";
import { TimeEstimateBadge } from "@/components/time-estimate-badge";
import type React from "react";
import {
  ChecklistV2StructuredItem,
  TimeEstimate,
} from "../checklist-v2.types";

const filterCompletedItemsIfHidden = ({
  items,
  showCompleted,
}: {
  showCompleted: boolean;
  items: ChecklistV2StructuredItem[];
}): ChecklistV2StructuredItem[] => {
  if (!showCompleted) {
    return items.filter((item) => !item.completed);
  }

  return items;
};

export const ChecklistItemGroup: React.FC<{
  groupId: string;
  name: string;
  items: (ChecklistV2StructuredItem & { sectionName?: string })[];
  groupBy: "section" | "context";
  showCompleted: boolean;
  updatedAtIso: Date;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}> = ({
  groupId,
  name,
  items,
  groupBy,
  showCompleted,
  updatedAtIso,
  onChange,
}) => {
  const visibleItems = filterCompletedItemsIfHidden({
    showCompleted,
    items,
  });

  return (
    <div key={`${groupId}-${updatedAtIso.toISOString()}`}>
      <Fieldset
        legend={
          <>
            <span className="mr-1">{name}</span>
            <div className="text-xs font-normal">
              <TimeEstimateBadge
                timeEstimates={items.reduce((acc, item) => {
                  if (!item.completed && item.timeEstimate) {
                    acc.push(item.timeEstimate);
                  }
                  return acc;
                }, [] as TimeEstimate[])}
              />
            </div>
          </>
        }
      >
        <ul className="space-y-3">
          {items.map((item) => {
            const groupDetail =
              groupBy === "section" ? item.context : item.sectionName;
            const note = [groupDetail, item.note]
              .filter((value): value is string => Boolean(value))
              .join(" / ");

            if (item.completed && !showCompleted) {
              return (
                <div
                  className="hidden"
                  key={`${item.id}-${updatedAtIso.toISOString()}`}
                >
                  <Checkbox
                    defaultChecked={item.completed}
                    name={`item__${item.id}`}
                    note={note || undefined}
                    onChange={onChange}
                  >
                    {"This is hidden"}
                  </Checkbox>
                </div>
              );
            }

            return (
              <li
                key={`${item.id}-${updatedAtIso.toISOString()}`}
                className="flex flex-col space-y-.5"
              >
                <Checkbox
                  defaultChecked={item.completed}
                  name={`item__${item.id}`}
                  note={note || undefined}
                  onChange={onChange}
                >
                  <div className="flex justify-between w-full">
                    <span>{item.name}</span>
                    {item.timeEstimate && (
                      <TimeEstimateBadge timeEstimates={[item.timeEstimate]} />
                    )}
                  </div>
                </Checkbox>
              </li>
            );
          })}
        </ul>

        {visibleItems.length === 0 && (
          <p className="text-xs text-zinc-700 dark:text-zinc-300">
            (No items)
          </p>
        )}
      </Fieldset>
    </div>
  );
};
