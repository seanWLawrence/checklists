import { LinkButton } from "@/components/link-button";
import { Heading } from "@/components/heading";

import { ChecklistV2 } from "./checklist-v2.types";
import { EitherAsync } from "purify-ts/EitherAsync";
import { getAllChecklistsV2 } from "./model/get-all-checklists-v2.model";
import Link from "next/link";
import { groupItemsByNameCategory } from "@/lib/group-items-by-name-category";

export const dynamic = "force-dynamic";

const ChecklistsV2: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const checklists = await fromPromise(getAllChecklistsV2());

    const categorizedChecklists = groupItemsByNameCategory({
      items: checklists,
    });

    return (
      <main className="space-y-6">
        <section className="space-y-3">
          <div className="flex space-x-2 items-center">
            <Heading level={1}>Checklists</Heading>

            <Link
              className="underline underline-offset-2 text-xs"
              href={"/checklists/new"}
            >
              Create
            </Link>
          </div>

          {!categorizedChecklists.length && (
            <p className="text-sm text-zinc-700">No items.</p>
          )}

          <div className="space-y-1">
            {categorizedChecklists.map(({ category, items }) => {
              return (
                <div className="flex flex-col space-y-1" key={category}>
                  <Heading level={3}>{category}</Heading>

                  <div className="flex flex-wrap" key={category}>
                    {items.map(({ id, name }) => {
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
