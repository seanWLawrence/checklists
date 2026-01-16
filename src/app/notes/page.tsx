import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";

import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllNotes } from "./model/get-all-notes.model";

export const dynamic = "force-dynamic";

const Notes: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const notes = await fromPromise(getAllNotes());

    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Notes</Heading>

          {!notes.length && <p className="text-sm text-zinc-700">No items.</p>}

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
