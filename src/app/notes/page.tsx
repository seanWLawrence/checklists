import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";

import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllNotes } from "./model/get-all-notes.model";
import { Note } from "./types";

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

const Notes: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const notes = await fromPromise(getAllNotes());
    const categorizedNotes = getCategorizedNotes(notes);

    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Notes</Heading>

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
