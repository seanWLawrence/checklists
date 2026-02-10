import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";

import { ChecklistV2 } from "./checklist-v2.types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllChecklistsV2 } from "./model/get-all-checklists-v2.model";

export const dynamic = "force-dynamic";

const getCategorizedChecklists = (
  checklists: ChecklistV2[],
): { category: string; checklists: ChecklistV2[] }[] => {
  const uncategorized: ChecklistV2[] = [];
  const result: { [category: string]: ChecklistV2[] } = {};

  for (const checklist of checklists) {
    const nameSplit = checklist.name.trim().split("/");

    if (nameSplit.length === 1) {
      uncategorized.push(checklist);
      continue;
    }

    const [category, name] = nameSplit;

    if (!result[category]) {
      result[category] = [];
    }

    result[category].push({ ...checklist, name });
  }

  result["Other"] = uncategorized.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );

  return Object.entries(result)
    .map(([category, checklists]) => {
      return {
        category,
        checklists: [
          ...checklists.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
          ),
        ],
      };
    })
    .sort((a, b) =>
      a.category.toLowerCase().localeCompare(b.category.toLowerCase()),
    );
};

const ChecklistsV2: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const checklists = await fromPromise(getAllChecklistsV2());

    const categorizedChecklists = getCategorizedChecklists(checklists);

    return (
      <main>
        <section className="space-y-3">
          <Heading level={1}>Checklists</Heading>

          {!categorizedChecklists.length && (
            <p className="text-sm text-zinc-700">No items.</p>
          )}

          <div className="space-y-1">
            {categorizedChecklists.map(({ category, checklists }) => {
              return (
                <div className="flex flex-col space-y-1" key={category}>
                  <Heading level={3}>{category}</Heading>

                  <div className="flex flex-wrap" key={category}>
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
