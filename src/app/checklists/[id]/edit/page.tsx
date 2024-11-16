import { EitherAsync } from "purify-ts";
import { UUID } from "@/lib/types";
import { ChecklistV2Form } from "../../components/checklist-v2-form";
import { getChecklistV2 } from "../../model/get-checklist-v2.model";

type Params = Promise<{ id: string }>;

const EditChecklistV2: React.FC<{ params: Params }> = async (props) => {
  const { id } = await props.params;

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
