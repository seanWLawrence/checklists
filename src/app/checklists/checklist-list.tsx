import Link from "next/link";
import { Button } from "@/components/button";
import { Heading } from "@/components/heading";

import { getChecklists } from "./checklist.model";

export const ChecklistList: React.FC<{}> = async () => {
  const checklists = await getChecklists();

  return (
    <section className="space-y-3">
      <Heading level={1}>Checklists</Heading>

      <div className="flex flex-wrap">
        {!checklists?.length && (
          <p className="text-sm textt-zinc-700">No items.</p>
        )}
        {checklists?.map(({ id, name }) => {
          return (
            <Button variant="outline" key={id} className="mr-2 mb-2">
              <Link href={`/checklists/${id}`}>{name}</Link>
            </Button>
          );
        })}
      </div>
    </section>
  );
};
