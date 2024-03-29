import Link from "next/link";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

import { getAllChecklists } from "./checklist.model";

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
    const checklists = checklistsEither
      .extract()
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return (
      <section className="space-y-3">
        <Heading level={1}>Checklists</Heading>

        <div className="flex flex-wrap">
          {!checklists.length && (
            <p className="text-sm textt-zinc-700">No items.</p>
          )}

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
      </section>
    );
  }
};
