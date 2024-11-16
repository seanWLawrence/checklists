import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { CreatedAtLocal } from "./journal.types";
import { Button } from "@/components/button";
import { getAllCreatedAtLocals } from "./model/get-all-created-at-locals.model";
import { groupCreatedAtLocals } from "./lib/group-created-at-locals.lib";
import { prettyDate } from "./lib/pretty-date.lib";

const Journals: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const createdAtLocals = await fromPromise(getAllCreatedAtLocals());
    const groupedJournals = Object.entries(
      groupCreatedAtLocals(createdAtLocals),
    );

    return (
      <main className="space-y-2">
        <Heading level={1}>Journals</Heading>

        <div className="space-y-1">
          {groupedJournals.map(([year, monthMap]) => {
            const groupedMonths = Object.entries(monthMap);
            const lastMonthIndex = groupedMonths.length - 1;
            const hasMoreThanOneMonth = groupedMonths.length > 1;

            return (
              <section key={year} className="space-y-4">
                <Heading level={2}>{year}</Heading>

                <div className="space-y-1">
                  {groupedMonths.map(([month, createdAtLocals], index) => {
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
                                <Button variant="outline" className="mr-2 mb-2">
                                  {prettyDate(createdAtLocal, {
                                    withYear: false,
                                  })}
                                </Button>
                              </Link>
                            ))}
                        </div>

                        {hasMoreThanOneMonth && index < lastMonthIndex && (
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

        {createdAtLocals.length === 0 && <p>No journals found.</p>}
      </main>
    );
  }).mapLeft((error) => {
    return (
      <div className="space-y-2">
        <p className="text-sm text-zinc-600">No journals found.</p>
        <pre className="text-xs text-red-800">{String(error)}</pre>
      </div>
    );
  });

  return page.extract();
};

export default Journals;
