import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { getAllLogs } from "./model/get-all-logs.model";
import { LinkButton } from "@/components/link-button";

export const dynamic = "force-dynamic";

const Logs: React.FC = async () => {
  const page = await EitherAsync(async ({ fromPromise }) => {
    const logs = await fromPromise(getAllLogs());
    const sortedLogs = [...logs].sort((a, b) =>
      b.updatedAtIso.localeCompare(a.updatedAtIso),
    );

    return (
      <main className="space-y-3">
        <div className="flex space-x-2 items-center">
          <Heading level={1}>Logs</Heading>

          <Link className="underline underline-offset-2 text-xs" href="/logs/new">
            Create
          </Link>
        </div>

        {!sortedLogs.length && <p className="text-sm text-zinc-700">No items.</p>}

        <div className="flex flex-wrap">
          {sortedLogs.map((log) => (
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
