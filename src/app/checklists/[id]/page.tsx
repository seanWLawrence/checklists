"use server";
import Link from "next/link";
import {
  getChecklistById,
  onCheckboxesSave,
  onCheckboxesReset,
} from "@/app/checklists/checklist.model";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";

const Checklist: React.FC<{ params: { id: string } }> = async ({
  params: { id },
}) => {
  const checklist = await getChecklistById(id);

  if (checklist) {
    return (
      <form className="space-y-4 max-w-prose">
        <input
          type="hidden"
          value={JSON.stringify(checklist)}
          name="checklist"
        />

        <div className="space-x-2 flex items-center">
          <h1 className="text-3xl">{checklist.name}</h1>

          <div>
            <Button type="button" variant="outline">
              <Link href={`/checklists/${id}/edit`}>Edit</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {checklist.sections.map(({ id, name, items }) => {
            return (
              <fieldset
                key={id}
                className="space-y-1 border-2 border-zinc-700 px-5 pt-2 pb-5 rounded-lg w-full min-w-48"
              >
                <legend className="text-2xl">{name}</legend>

                <ul className="space-y-2">
                  {items.map(({ id, name, completed }) => {
                    return (
                      <li key={id} className="ml-5">
                        <Checkbox
                          defaultChecked={completed}
                          name={`item__${id}`}
                        >
                          {name}
                        </Checkbox>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>

        <div className="flex justify-between">
          <Button
            type="submit"
            variant="outline"
            formAction={onCheckboxesReset}
          >
            Reset
          </Button>

          <Button type="submit" variant="primary" formAction={onCheckboxesSave}>
            Save
          </Button>
        </div>
      </form>
    );
  }

  return <p>No checklist found with id: {id}</p>;
};

export default Checklist;
