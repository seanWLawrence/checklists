import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getAllCreatedAtLocals as getAllCreatedAtLocals } from "./journal.model";
import { Heading } from "@/components/heading";
import { groupCreatedAtLocals, prettyDate } from "./journal.lib";
import { CreatedAtLocal } from "./journal.types";
import { Button } from "@/components/button";

const Journals: React.FC<{ params: { createdAtIso: string } }> = async ({}) => {
  const node = await EitherAsync(async ({ fromPromise }) => {
    const createdAtLocals = await fromPromise(getAllCreatedAtLocals().run());
    const groupedJournals = Object.entries(
      groupCreatedAtLocals(createdAtLocals),
    );

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
                  {Object.entries(monthMap).map(
                    ([month, createdAtLocals], index) => {
                      return (
                        <div key={month}>
                          <div className="flex flex-wrap">
                            {[...(createdAtLocals as CreatedAtLocal[])]
                              .sort(
                                (createdAtLocalA, createdAtLocalB) =>
                                  new Date(createdAtLocalA).getTime() -
                                  new Date(createdAtLocalB).getTime(),
                              )
                              .map((createdAtLocal) => (
                                <Link
                                  href={`/journals/${createdAtLocal}`}
                                  key={createdAtLocal}
                                >
                                  <Button
                                    variant="outline"
                                    className="mr-2 mb-2"
                                  >
                                    {prettyDate(createdAtLocal, {
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
                    },
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {createdAtLocals.length === 0 && <p>No journals found.</p>}
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
