import { UUID } from "@/lib/types";
import { ChecklistForm } from "../../checklist-form";
import { getChecklist } from "../../checklist.model";
import { EitherAsync } from "purify-ts";

export const revalidate = 0;

const EditChecklist: React.FC<{
  params: { id: string };
}> = async ({ params }) => {
  const node = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(params.id));

    const checklist = await fromPromise(getChecklist(id).run());

    return <ChecklistForm initialChecklist={checklist} variant="edit" />;
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">No Checklist found.</p>
          <pre className="text-xs text-red-800">{String(error)}</pre>
        </div>
      );
    })
    .run();

  return node.toJSON();
};

export default EditChecklist;
