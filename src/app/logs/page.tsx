import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { getAllLogs } from "./model/get-all-logs.model";
import { LinkButton } from "@/components/link-button";
import { groupItemsByNameCategory } from "@/lib/group-items-by-name-category";

export const dynamic = "force-dynamic";

const Logs: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const logs = await fromPromise(getAllLogs());
    const categorizedLogs = groupItemsByNameCategory({
      items: [...logs].sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    });

    return (
      <main className="space-y-3">
        <div className="flex space-x-2 items-center">
          <Heading level={1}>Logs</Heading>

          <Link className="underline underline-offset-2 text-xs" href="/logs/new">
            Create
          </Link>
        </div>

        {!categorizedLogs.length && <p className="text-sm text-zinc-700">No items.</p>}

        <div className="space-y-1">
          {categorizedLogs.map(({ category, items }) => (
            <div className="flex flex-col space-y-1" key={category}>
              <Heading level={3}>{category}</Heading>

              <div className="flex flex-wrap">
                {items.map((log) => (
                  <LinkButton
                    key={log.id}
                    href={`/logs/${log.id}`}
                    variant="outline"
                    className="mr-2 mb-2"
                  >
                    {log.name}
                  </LinkButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }).mapLeft((error) => (
    <main>
      <section className="space-y-3">
        <Heading level={1}>Logs</Heading>

        <div className="space-y-2">
          <p>Error loading logs</p>
          <pre className="text-xs text-red-800 max-w-prose">{String(error)}</pre>
        </div>
      </section>
    </main>
  ));

  return page.extract();
};

export default Logs;
