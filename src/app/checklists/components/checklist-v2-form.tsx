"use client";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { ChecklistV2 } from "../checklist-v2.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { MenuButton } from "@/components/menu-button";
import { Maybe } from "purify-ts/Maybe";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { structureChecklistContent } from "../[id]/structure-checklist-content";
import {
  checklistV2TaskFormToContent,
  getIsCompletedFromStructuredChecklist,
} from "../[id]/checklist-v2-task-form-to-content";
import { createChecklistV2Action } from "../actions/create-checklist-v2.action";
import { deleteChecklistV2Action } from "../actions/delete-checklist-v2.action";
import { updateChecklistV2Action } from "../actions/update-checklist-v2.action";

export const ChecklistV2Form: React.FC<{
  checklist?: ChecklistV2;
}> = ({ checklist }) => {
  const isEdit = !!checklist;
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  return (
    <div className="space-y-2 max-w-prose">
      <div className="flex space-x-1 items-center">
        <Heading level={1}>{isEdit ? "Edit" : "New"} checklist</Heading>

        {isEdit && (
          <MenuButton
            variant="ghost"
            menu={
              <div className="flex flex-col space-y-2">
                {checklist?.content && (
                  <>
                    <form
                      action={async () => {
                        Maybe.fromNullable(contentRef.current).ifJust(
                          (contentRef) => {
                            const content = contentRef.value;

                            const checklist =
                              structureChecklistContent(content);

                            for (const section of checklist.sections) {
                              section.items = [];
                            }

                            const newContent = checklistV2TaskFormToContent({
                              checklist,
                              getIsCompleted:
                                getIsCompletedFromStructuredChecklist({
                                  checklist,
                                }),
                            });

                            contentRef.value = newContent;
                          },
                        );
                      }}
                    >
                      <Button type="submit" variant="ghost">
                        Clear items
                      </Button>
                    </form>

                    <form
                      action={async () => {
                        Maybe.fromNullable(contentRef.current).ifJust(
                          (contentRef) => {
                            const content = contentRef.value;

                            const checklist =
                              structureChecklistContent(content);

                            for (const section of checklist.sections) {
                              section.items = section.items.filter(
                                (i) => !i.completed,
                              );
                            }

                            const newContent = checklistV2TaskFormToContent({
                              checklist,
                              getIsCompleted:
                                getIsCompletedFromStructuredChecklist({
                                  checklist,
                                }),
                            });

                            contentRef.value = newContent;
                          },
                        );
                      }}
                    >
                      <Button type="submit" variant="ghost">
                        Clear completed items
                      </Button>
                    </form>
                  </>
                )}

                {isEdit && (
                  <form
                    action={() => {
                      const name = Maybe.fromNullable(
                        window.prompt("New name?"),
                      );

                      const content = Maybe.fromNullable(
                        contentRef.current,
                      ).map(($el) => $el.value);

                      Maybe.sequence([name, content]).map(
                        async ([name, content]) => {
                          const formData = new FormData();

                          formData.set("name", name);
                          formData.set("content", content);

                          await createChecklistV2Action(formData);
                        },
                      );
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Duplicate
                    </Button>
                  </form>
                )}

                {isEdit && (
                  <form
                    action={async () => {
                      Maybe.fromFalsy(window.confirm("Delete?"))
                        .chain(() => Maybe.fromNullable(checklist))
                        .ifJust(async (checklist) => {
                          await deleteChecklistV2Action(checklist.id);

                          router.push("/checklists");
                        });
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

      <form
        action={checklist ? updateChecklistV2Action : createChecklistV2Action}
        className="space-y-2"
      >
        <Label label="Name">
          <Input
            type="text"
            name="name"
            min="1"
            max="5"
            defaultValue={checklist?.name}
            required
          />
        </Label>

        {checklist && (
          <input
            name="metadata"
            type="hidden"
            value={JSON.stringify(checklist)}
            readOnly
            required
          />
        )}

        <Label label="Content">
          <textarea
            name="content"
            defaultValue={checklist?.content}
            className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 max-w-prose w-full"
            rows={20}
            required
            ref={contentRef}
          />
        </Label>

        <div className="flex justify-end w-full max-w-xl">
          <Button type="submit" variant="primary">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};
