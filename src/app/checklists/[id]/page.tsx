import Link from "next/link";
import { getChecklist } from "@/app/checklists/checklist.model";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Heading } from "@/components/heading";
import { MenuButton } from "@/components/menu-button";
import { UUID } from "@/lib/types";
import { EitherAsync } from "purify-ts/EitherAsync";

export const revalidate = 0;

const Checklist: React.FC<{ params: { id: string } }> = async ({ params }) => {
  const node = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(params.id));
    const checklist = await fromPromise(getChecklist(id));

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
                  <Link href={`/checklists/${id}/edit`}>
                    <Button type="button" variant="ghost">
                      Edit
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    variant="ghost"
                    // formAction={onCheckboxesReset}
                  >
                    Reset
                  </Button>
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
          <Button
            type="submit"
            variant="primary"
            // formAction={onCheckboxesSave}
          >
            Save
          </Button>
        </div>
      </form>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p>No checklist found with id: {params.id}</p>
          <p className="text-xs text-red-800">{String(error)}</p>
        </div>
      );
    })
    .run();

  return node.toJSON();
};

export default Checklist;
