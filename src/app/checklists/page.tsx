import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";

import { ChecklistV2 } from "./checklist-v2.types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllChecklistsV2 } from "./model/get-all-checklists-v2.model";

export const dynamic = "force-dynamic";

const ChecklistsV2: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const checklists = await fromPromise(getAllChecklistsV2());

    const checklistsByFirstChar = Array.from(
      checklists
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        )
        .reduce((acc, x) => {
          const firstChar = x.name.trim().at(0)?.toLowerCase();

          if (!firstChar) {
            return acc;
          }

          const checklistsForFirstChar = acc.get(firstChar) ?? [];
          checklistsForFirstChar.push(x);

          acc.set(firstChar, checklistsForFirstChar);

          return acc;
        }, new Map<string, ChecklistV2[]>())
        .entries(),
    );

    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Checklists</Heading>

          {!checklistsByFirstChar.length && (
            <p className="text-sm text-zinc-700">No items.</p>
          )}

          <div className="space-y-1">
            {checklistsByFirstChar.map(([firstChar, checklists]) => {
              return (
                <div className="flex flex-wrap" key={firstChar}>
                  {checklists.map(({ id, name }) => {
                    return (
                      <LinkButton
                        href={`/checklists/${id}`}
                        key={id}
                        variant="outline"
                        className="mr-2 mb-2"
                      >
                        {name}
                      </LinkButton>
                    );
                  })}
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
          <Heading level={1}>Checklists</Heading>

          <div className="space-y-2">
            <p>Error loading checklists</p>

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

export default ChecklistsV2;
