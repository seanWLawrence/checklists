"use server";
import Link from "next/link";
import {
  getChecklistById,
  onCheckboxesSave,
  onCheckboxesReset,
} from "@/app/checklists/checklist.model";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { MenuButton } from "@/components/menu-button";

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
          <Heading level={1}>{checklist.name}</Heading>

          <div>
            <MenuButton
              variant="ghost"
              menu={
                <div className="flex flex-col space-y-2">
                  <div>
                    <Button
                      type="submit"
                      variant="ghost"
                      formAction={onCheckboxesReset}
                    >
                      Reset
                    </Button>
                  </div>

                  <div>
                    <Button type="button" variant="ghost">
                      <Link href={`/checklists/${id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          {checklist.sections.map(({ id, name, items }) => {
            return (
              <fieldset
                key={id}
                className="space-y-1 border-2 border-zinc-700 px-5 pt-2 pb-5 rounded-lg w-full min-w-48"
              >
                <Heading level="legend">{name}</Heading>

                {items.length ? (
                  <ul className="space-y-2">
                    {items.map(({ id, name, completed, note }) => {
                      return (
                        <li key={id} className="ml-5 flex flex-col space-y-1">
                          <Checkbox
                            defaultChecked={completed}
                            name={`item__${id}`}
                          >
                            {name}
                          </Checkbox>

                          {note && (
                            <p className="text-xs text-zinc-500 ml-8">{note}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-zinc-700">(No items)</p>
                )}
              </fieldset>
            );
          })}
        </div>

        <div className="flex justify-end">
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
