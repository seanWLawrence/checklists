"use client";
import Link from "next/link";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { Checklist, ChecklistItemTimeEstimate } from "@/lib/types";
import {
  markItemsIncompleteAction,
  updateChecklistItemsAction,
} from "../checklist.model";
import { cn } from "@/lib/utils";
import { Maybe } from "purify-ts/Maybe";
import React from "react";

const unitToMinutes = { h: 60, m: 1 };

const getTimeEstimateInMinutes = (timeEstimate: ChecklistItemTimeEstimate) => {
  return Maybe.fromNullable(timeEstimate.match(/^\d+/)?.[0])
    .map(Number)
    .chain((num) => {
      return Maybe.fromNullable(timeEstimate.match(/(m|h)$/)?.[0]).map(
        (unit) => {
          return { unit, num };
        },
      );
    })
    .map(({ unit, num }) => {
      return unitToMinutes[unit as keyof typeof unitToMinutes] * num;
    })
    .orDefault(0);
};

const roundToNearestHalf = (num: number): number => {
  return Math.round(num * 2) / 2;
};

const roundToNearestFive = (num: number): number => {
  return Math.round(num / 5) * 5;
};

const getTimeEstimateFromMinutes = (
  minutes: number,
): ChecklistItemTimeEstimate => {
  if (minutes >= 60) {
    return `${roundToNearestHalf(minutes / 60)}h`;
  }

  return `${roundToNearestFive(minutes)}m`;
};

const sumTimeEstimates = (
  timeEstimates: (ChecklistItemTimeEstimate | undefined)[],
): ChecklistItemTimeEstimate => {
  const sumInMinutes = timeEstimates.reduce((acc, x) => {
    acc += x ? getTimeEstimateInMinutes(x) : 0;

    return acc;
  }, 0);

  return getTimeEstimateFromMinutes(sumInMinutes);
};

const TimeEstimateBadge: React.FC<{
  timeEstimates: (ChecklistItemTimeEstimate | undefined)[];
}> = ({ timeEstimates }) => {
  return (
    <span>
      <span className="text-xs bg-zinc-200 text-zinc-900 rounded py-1 px-1.5">
        {sumTimeEstimates(timeEstimates)}
      </span>
    </span>
  );
};

export const ChecklistItemForm: React.FC<{ checklist: Checklist }> = ({
  checklist,
}) => {
  const hasCompletedItems = checklist.sections.some((section) => {
    return section.items.some((item) => item.completed);
  });

  return (
    <form className="space-y-4 max-w-prose">
      <input type="hidden" value={JSON.stringify(checklist)} name="checklist" />

      <div className="flex items-center space-x-1">
        <Heading level={1}>{checklist.name}</Heading>

        <TimeEstimateBadge
          timeEstimates={checklist.sections.reduce((acc, x) => {
            x.items.forEach((item) => {
              if (!item.completed && item.timeEstimate) {
                acc.push(item.timeEstimate);
              }
            });
            return acc;
          }, [] as ChecklistItemTimeEstimate[])}
        />

        <Link
          href={`/checklists/${checklist.id}/edit`}
          className="underline underline-offset-2"
        >
          <Button type="button" variant="ghost">
            Edit
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {checklist.sections.map(({ id, name, items }) => {
          return (
            <div key={id}>
              <fieldset className="space-y-1 border-2 border-zinc-700 px-3 pt-2 pb-3 rounded-lg w-full min-w-48">
                <Heading level="legend" className="flex items-center space-x-2">
                  <span>{name}</span>

                  <div className="text-xs font-normal">
                    <TimeEstimateBadge
                      timeEstimates={items.reduce((acc, x) => {
                        if (!x.completed && x.timeEstimate) {
                          acc.push(x.timeEstimate);
                        }
                        return acc;
                      }, [] as ChecklistItemTimeEstimate[])}
                    />
                  </div>
                </Heading>

                {items.length ? (
                  <div>
                    <ul className="space-y-2">
                      {items.map(
                        ({ id, name, completed, note, timeEstimate }) => {
                          return (
                            <li key={id} className="flex flex-col space-y-.5">
                              <Checkbox
                                defaultChecked={completed}
                                name={`item__${id}`}
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

                              {note && (
                                <p className="text-xs text-zinc-600 ml-10">
                                  {note}
                                </p>
                              )}
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-700">(No items)</p>
                )}
              </fieldset>
            </div>
          );
        })}
      </div>

      <div
        className={cn("flex", {
          "justify-between": hasCompletedItems,
          "justify-end": !hasCompletedItems,
        })}
      >
        {hasCompletedItems && (
          <Button
            type="submit"
            variant="outline"
            formAction={async (formData) => {
              await markItemsIncompleteAction(formData);

              window.location.reload();
            }}
          >
            Mark all incomplete
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          formAction={updateChecklistItemsAction}
        >
          Save
        </Button>
      </div>
    </form>
  );
};
