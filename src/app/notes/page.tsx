import Link from "next/link";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllNotes } from "./model/get-all-notes.model";

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
                <Link href={`/notes/${id}`} key={id}>
                  <Button variant="outline" className="mr-2 mb-2">
                    {name}
                  </Button>
                </Link>
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
