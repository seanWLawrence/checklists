"use client";
import Link from "next/link";
import { Button } from "@/components/button";

import { type IChecklist } from "@/lib/types";

export const ChecklistList: React.FC<{}> = () => {
  const checklists: IChecklist[] = [];

  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold">Checklists</h1>

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

      <div>
        <Button variant="outline">
          <Link href={"/checklists/new"}>Create checklist</Link>
        </Button>
      </div>
    </section>
  );
};
