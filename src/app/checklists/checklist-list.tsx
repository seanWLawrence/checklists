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
};
