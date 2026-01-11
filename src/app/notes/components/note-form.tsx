"use client";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";
import { Note } from "../types";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { MenuButton } from "@/components/menu-button";
import { Maybe } from "purify-ts/Maybe";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { deleteNoteAction } from "../actions/delete-note.action";
import { updateNoteAction } from "../actions/update-note.action";
import { createNoteAction } from "../actions/create-note.action";

export const NoteForm: React.FC<{
  note?: Note;
}> = ({ note }) => {
  const isEdit = !!note;
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  return (
    <div className="space-y-2 max-w-prose">
      <div className="flex space-x-1 items-center">
        <Heading level={1}>{isEdit ? "Edit" : "New"} note</Heading>

        {isEdit && (
          <MenuButton
            variant="ghost"
            menu={
              <div className="flex flex-col space-y-2">
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

                          await createNoteAction(formData);
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
                        .chain(() => Maybe.fromNullable(note))
                        .ifJust(async (checklist) => {
                          await deleteNoteAction(checklist.id);

                          router.push("/notes");
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
        action={note ? updateNoteAction : createNoteAction}
        className="space-y-2"
      >
        <Label label="Name">
          <Input
            type="text"
            name="name"
            min="1"
            max="5"
            defaultValue={note?.name}
            required
          />
        </Label>

        {note && (
          <input
            name="metadata"
            type="hidden"
            value={JSON.stringify(note)}
            readOnly
            required
          />
        )}

        <Label label="Content">
          <textarea
            name="content"
            defaultValue={note?.content}
            className="rounded-lg py-1 px-2 text-sm border-2 border-zinc-900 max-w-prose w-full bg-white text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
