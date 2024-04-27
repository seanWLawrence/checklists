import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getAllJournals } from "./journal.model";
import { Heading } from "@/components/heading";
import { groupJournals, prettyDate } from "./journal.lib";
import { Journal } from "./journal.types";
import { Button } from "@/components/button";

const Journals: React.FC<{ params: { createdAtIso: string } }> = async ({}) => {
  const node = await EitherAsync(async ({ fromPromise }) => {
    const journals = await fromPromise(getAllJournals().run());
    const groupedJournals = Object.entries(groupJournals(journals));

    return (
      <main className="space-y-2">
        <Heading level={1}>Journals</Heading>

        <div className="space-y-1">
          {groupedJournals.map(([year, monthMap]) => {
            const lastMonthIndex = groupedJournals.length - 1;
            const hasMoreThanOneMonth = Object.keys(monthMap).length > 1;

            return (
              <section key={year} className="space-y-4">
                <Heading level={2}>{year}</Heading>

                <div className="space-y-1">
                  {Object.entries(monthMap).map(([month, journals], index) => {
                    return (
                      <div key={month}>
                        <div className="flex flex-wrap">
                          {[...(journals as Journal[])]
                            .sort(
                              (a, b) =>
                                new Date(a.createdAtLocal).getTime() -
                                new Date(b.createdAtLocal).getTime(),
                            )
                            .map((j) => (
                              <Link
                                href={`/journals/${j.createdAtLocal}`}
                                key={j.createdAtIso.toISOString()}
                              >
                                <Button variant="outline" className="mr-2 mb-2">
                                  {prettyDate(j.createdAtLocal, {
                                    withYear: false,
                                  })}
                                </Button>
                              </Link>
                            ))}
                        </div>

                        {index < lastMonthIndex && hasMoreThanOneMonth && (
                          <hr className="border-t-2 border-t-zinc-300 mt-2 mb-4 max-w-10" />
                        )}
                      </div>
                    );
                  })}
                </div>
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
