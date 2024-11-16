import { EitherAsync } from "purify-ts";
import { UUID } from "@/lib/types";
import { structureChecklistContent } from "./structure-checklist-content";
import { ChecklistV2TaskForm } from "./checklist-v2-task-form";
import { getChecklistV2 } from "../model/get-checklist-v2.model";

type Params = Promise<{ id: string }>;

const ChecklistV2View: React.FC<{ params: Params }> = async (props) => {
  const { id } = await props.params;

  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const validId = await liftEither(UUID.decode(id));
    const checklist = await fromPromise(getChecklistV2(validId));

    const structuredChecklist = structureChecklistContent(checklist.content);

    return (
      <main>
        <ChecklistV2TaskForm
          structuredChecklist={{ ...checklist, ...structuredChecklist }}
        />
      </main>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p>No checklist found with id: {id}</p>
          <p className="text-xs text-red-800">{String(error)}</p>
        </div>
      );
    })
    .run();

  return page.extract();
};

export default ChecklistV2View;
