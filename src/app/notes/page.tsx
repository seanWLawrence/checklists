import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";
import { Label } from "@/components/label";
import { Input } from "@/components/input";
import { SubmitButton } from "@/components/submit-button";

import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllNotes } from "./model/get-all-notes.model";
import { Note } from "./types";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const getCategorizedNotes = (
  notes: Note[],
): { category: string; notes: Note[] }[] => {
  const uncategorized: Note[] = [];
  const result: { [category: string]: Note[] } = {};

  for (const note of notes) {
    const nameSplit = note.name.trim().split("/");

    if (nameSplit.length === 1) {
      uncategorized.push(note);
      continue;
    }

    const [category, name] = nameSplit;

    if (!result[category]) {
      result[category] = [];
    }

    result[category].push({ ...note, name });
  }

  if (uncategorized.length) {
    result["Other"] = uncategorized.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );
  }

  return Object.entries(result)
    .map(([category, notes]) => ({
      category,
      notes: [...notes].sort((a, b) =>
        a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
      ),
    }))
    .sort((a, b) =>
      a.category.toLowerCase().localeCompare(b.category.toLowerCase()),
    );
};

const HIDDEN_PREFIX = "Hidden/";

const Notes: React.FC<{
  searchParams?: Promise<{ q?: string }>;
}> = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const q =
    typeof resolvedSearchParams?.q === "string"
      ? resolvedSearchParams.q.trim()
      : "";

  const page = await EitherAsync(async ({ fromPromise }) => {
    const notes = await fromPromise(getAllNotes());
    const filteredNotes =
      q.length > 0
        ? notes.filter((note) =>
            note.name.toLowerCase().includes(q.toLowerCase()),
          )
        : notes.filter((note) => !note.name.trim().startsWith(HIDDEN_PREFIX));
    const categorizedNotes = getCategorizedNotes(filteredNotes);

    return (
      <main>
        <section className="space-y-3">
          <div className="flex space-x-2 items-center">
            <Heading level={1}>Notes</Heading>

            <Link
              className="underline underline-offset-2 text-xs"
              href={"/notes/new"}
            >
              Create
            </Link>
          </div>

          <form
            className="space-y-2"
            action={async (formData) => {
              "use server";
              const searchText = formData.get("q");
              const trimmedSearchText =
                typeof searchText === "string" ? searchText.trim() : "";
              const params = new URLSearchParams();

              if (trimmedSearchText !== "") {
                params.set("q", trimmedSearchText);
              }

              redirect(
                `/notes${params.size > 0 ? `?${params.toString()}` : ""}`,
              );
            }}
          >
            <div className="flex max-w-fit items-end space-x-2">
              <Label label="Search notes">
                <Input
                  name="q"
                  defaultValue={q}
                  placeholder="Search by note name"
                  autoComplete="off"
                  className="min-w-64"
                />
              </Label>

              <SubmitButton variant="primary">Filter</SubmitButton>
            </div>
          </form>

          {!categorizedNotes.length && (
            <p className="text-sm text-zinc-700">No items.</p>
          )}

          <div className="space-y-1">
            {categorizedNotes.map(({ category, notes }) => {
              return (
                <div className="flex flex-col space-y-1" key={category}>
                  <Heading level={3}>{category}</Heading>

                  <div className="flex flex-wrap">
                    {notes.map(({ id, name }) => {
                      return (
                        <LinkButton
                          href={`/notes/${id}`}
                          key={id}
                          variant="outline"
                          className="mr-2 mb-2"
                        >
                          {name}
                        </LinkButton>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    );
  }).mapLeft((error) => {
    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Notes</Heading>

          <div className="space-y-2">
            <p>Error loading notes</p>

            <pre className="text-xs text-red-800 max-w-prose">
              {String(error)}
            </pre>
          </div>
        </section>
      </main>
    );
  });

  return page.extract();
};

export default Notes;
