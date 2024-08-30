import { EitherAsync } from "purify-ts/EitherAsync";
import { getChecklist } from "@/app/checklists-legacy/checklist.model";
import { UUID } from "@/lib/types";
import { ChecklistItemForm } from "./checklist-item-form";

const Checklist: React.FC<{ params: { id: string } }> = async ({ params }) => {
  const node = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(params.id));
    const checklist = await fromPromise(getChecklist(id));

    return <ChecklistItemForm checklist={checklist} />;
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
