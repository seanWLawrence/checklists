import Link from "next/link";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

import { getAllChecklists } from "./checklist.model";
import { Checklist } from "./checklist.types";

export const ChecklistList: React.FC = async () => {
  const checklistsEither = await getAllChecklists().run();

  if (checklistsEither.isLeft()) {
    return (
      <section className="space-y-3">
        <Heading level={1}>Checklists</Heading>

        {checklistsEither.isLeft() && (
          <div className="space-y-2">
            <p>Error loading checklists</p>

            <pre className="text-xs text-red-800 max-w-prose">
              {String(checklistsEither.extract())}
            </pre>
          </div>
        )}
      </section>
    );
  }

  if (checklistsEither.isRight()) {
    const checklistsByFirstChar = Array.from(
      checklistsEither
        .extract()
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
        }, new Map<string, Checklist[]>())
        .entries(),
    );

    return (
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
                    <Link href={`/checklists/${id}`} key={id}>
                      <Button variant="outline" className="mr-2 mb-2">
                        {name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    );
  }
};
