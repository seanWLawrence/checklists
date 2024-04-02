import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getAllJournals } from "./journal.model";
import { Heading } from "@/components/heading";
import { groupJournals, months, prettyDate } from "./journal.lib";
import { Journal } from "./journal.types";

const Journals: React.FC<{ params: { createdAtIso: string } }> = async ({}) => {
  const node = await EitherAsync(async ({ fromPromise }) => {
    const journals = await fromPromise(getAllJournals().run());

    console.log(Object.entries(groupJournals(journals)));

    return (
      <main className="space-y-2">
        <Heading level={1}>Journals</Heading>

        <div className="space-y-1">
          {Object.entries(groupJournals(journals)).map(([year, monthMap]) => {
            return (
              <section key={year} className="space-y-3">
                {Object.entries(monthMap).map(([month, journals]) => {
                  return (
                    <section key={month}>
                      <Heading level={2}>
                        {months[Number(month) - 1]} {year}
                      </Heading>

                      <ul className="space-y-1">
                        {[...(journals as Journal[])]
                          .sort(
                            (a, b) =>
                              new Date(a.createdAtLocal).getTime() -
                              new Date(b.createdAtLocal).getTime(),
                          )
                          .map((j) => (
                            <li
                              key={j.createdAtIso.toISOString()}
                              className="list-disc ml-4"
                            >
                              <Link
                                href={`/journals/${j.createdAtLocal}`}
                                className="underline underline-offset-4"
                              >
                                {prettyDate(j.createdAtLocal, {
                                  withYear: false,
                                })}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </section>
                  );
                })}
              </section>
            );
          })}
        </div>

        {journals.length === 0 && <p>No journals found.</p>}
      </main>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">No journals found.</p>
          <pre className="text-xs text-red-800">{String(error)}</pre>
        </div>
      );
    })
    .run();

  return node.toJSON();
};

export default Journals;
