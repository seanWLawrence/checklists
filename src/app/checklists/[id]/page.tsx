import { getChecklistById } from "@/app/checklists/checklist.model";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import Link from "next/link";

const Checklist: React.FC<{ params: { id: string } }> = async ({
  params: { id },
}) => {
  const checklist = await getChecklistById(id);

  if (checklist) {
    return (
      <div className="space-y-4">
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
              <section key={id} className="space-y-2">
                <h2>{name}</h2>

                <ul className="space-y-1">
                  {items.map(({ id, name, completed }) => {
                    return (
                      <li key={id} className="ml-5">
                        <Checkbox
                          defaultChecked={completed}
                          name={`checklistItem__${id}`}
                        >
                          {name}
                        </Checkbox>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline">
            Reset
          </Button>

          <Button type="button" variant="primary">
            Save
          </Button>
        </div>
      </div>
    );
  }

  return <p>No checklist found with id: {id}</p>;
};

export default Checklist;
