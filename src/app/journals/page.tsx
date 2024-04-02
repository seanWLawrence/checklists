import Link from "next/link";
import { EitherAsync } from "purify-ts/EitherAsync";

import { getAllJournals } from "./journal.model";
import { Heading } from "@/components/heading";

const Journals: React.FC<{ params: { createdAtIso: string } }> = async ({}) => {
  const node = await EitherAsync(async ({ fromPromise }) => {
    const journals = await fromPromise(getAllJournals().run());

    return (
      <main className="space-y-2">
        <Heading level={1}>Journals</Heading>

        <ul className="space-y-1">
          {journals.map((j) => (
            <li key={j.createdAtIso.toISOString()}>
              <Link href={`/journals/${j.createdAtLocal}`}>
                {j.createdAtLocal}
              </Link>
            </li>
          ))}
        </ul>

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
