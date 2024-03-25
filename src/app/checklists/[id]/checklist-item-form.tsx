"use client";
import Link from "next/link";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { Checklist } from "@/lib/types";
import {
  markItemsIncompleteAction,
  updateChecklistItemsAction,
} from "../checklist.model";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export const ChecklistItemForm: React.FC<{ checklist: Checklist }> = ({
  checklist,
}) => {
  const router = useRouter();

  const hasCompletedItems = checklist.sections.some((section) => {
    return section.items.some((item) => item.completed);
  });

  return (
    <form className="space-y-4 max-w-prose">
      <input type="hidden" value={JSON.stringify(checklist)} name="checklist" />

      <div className="flex items-start">
        <Heading level={1}>{checklist.name}</Heading>

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
            <fieldset
              key={id}
              className="space-y-1 border-2 border-zinc-700 px-5 pt-2 pb-5 rounded-lg w-full min-w-48"
            >
              <Heading level="legend">{name}</Heading>

              {items.length ? (
                <ul className="space-y-2">
                  {items.map(({ id, name, completed, note }) => {
                    return (
                      <li key={id} className="ml-5 flex flex-col space-y-1">
                        <Checkbox
                          defaultChecked={completed}
                          name={`item__${id}`}
                        >
                          {name}
                        </Checkbox>

                        {note && (
                          <p className="text-xs text-zinc-500 ml-8">{note}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-zinc-700">(No items)</p>
              )}
            </fieldset>
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
