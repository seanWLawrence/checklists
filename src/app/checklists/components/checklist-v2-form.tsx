"use client";
import { Button } from "@/components/button";
import { SubmitButton } from "@/components/submit-button";
import { Heading } from "@/components/heading";
import { ChecklistV2 } from "../checklist-v2.types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { MenuButton } from "@/components/menu-button";
import { Maybe } from "purify-ts/Maybe";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { structureChecklistContent } from "../[id]/structure-checklist-content";
import {
  checklistV2TaskFormToContent,
  getIsCompletedFromStructuredChecklist,
} from "../[id]/checklist-v2-task-form-to-content";
import { createChecklistV2Action } from "../actions/create-checklist-v2.action";
import { deleteChecklistV2Action } from "../actions/delete-checklist-v2.action";
import { updateChecklistV2Action } from "../actions/update-checklist-v2.action";
import {
  ChecklistShareLinkState,
  createChecklistShareLinkAction,
} from "../actions/create-checklist-share-link.action";

export const ChecklistV2Form: React.FC<{
  checklist?: ChecklistV2;
}> = ({ checklist }) => {
  const isEdit = !!checklist;
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [shareState, shareAction] = useActionState<
    ChecklistShareLinkState,
    FormData
  >(createChecklistShareLinkAction, {
    url: "",
    expiresAtIso: "",
    error: "",
  });
  const [copied, setCopied] = useState(false);

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
                      <SubmitButton type="submit" variant="ghost">
                        Clear items
                      </SubmitButton>
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
                      <SubmitButton type="submit" variant="ghost">
                        Clear completed items
                      </SubmitButton>
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
                    <SubmitButton type="submit" variant="ghost">
                      Duplicate
                    </SubmitButton>
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
                    <SubmitButton type="submit" variant="ghost">
                      Delete
                    </SubmitButton>
                  </form>
                )}

                {isEdit && (
                  <form action={shareAction}>
                    <input
                      type="hidden"
                      name="checklistId"
                      value={checklist?.id}
                    />
                    <SubmitButton type="submit" variant="ghost">
                      Create share link
                    </SubmitButton>
                  </form>
                )}
              </div>
            }
          />
        )}
      </div>

      {shareState.error && (
        <p className="text-xs text-red-800">{shareState.error}</p>
      )}

      {shareState.url && (
        <div className="flex items-end space-x-2">
          <Label label="Share link (expires in 1 day)" className="flex-1">
            <Input value={shareState.url} readOnly className="bg-zinc-100" />
          </Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(shareState.url).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      )}

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
            className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 max-w-prose w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={20}
            required
            ref={contentRef}
          />
        </Label>

        <div className="flex justify-end w-full max-w-xl">
          <SubmitButton type="submit" variant="primary">
            Save
          </SubmitButton>
        </div>
      </form>
    </div>
  );
};
