import { EitherAsync } from "purify-ts";
import { ChecklistV2Form } from "../../checklist-v2-form";
import { getChecklistV2 } from "../../checklist-v2.model";
import { UUID } from "@/lib/types";

const EditChecklistV2: React.FC<{ params: { id: string } }> = async ({
  params: { id },
}) => {
  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const validId = await liftEither(UUID.decode(id));
    const checklist = await fromPromise(getChecklistV2(validId));

    return (
      <main>
        <ChecklistV2Form checklist={checklist} />
      </main>
    );
  }).mapLeft((error) => {
    return (
      <div className="space-y-2">
        <p>No checklist found with id: {id}</p>
        <p className="text-xs text-red-800">{String(error)}</p>
      </div>
    );
  });

  return page.extract();
};

export default EditChecklistV2;
