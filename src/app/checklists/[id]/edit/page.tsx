import { UUID } from "@/lib/types";
import { ChecklistForm } from "../../checklist-form";
import { getChecklist } from "../../checklist.model";

export const revalidate = 0;

const EditChecklist: React.FC<{
  params: { id: string };
}> = async ({ params }) => {
  const idEither = UUID.decode(params.id);

  if (idEither.isLeft()) {
    return <p>Invalid ID</p>;
  }

  if (idEither.isRight()) {
    const id = idEither.extract();
    const checklistEither = await getChecklist(id);

    if (checklistEither.isLeft()) {
      return (
        <div>
          <p className="text-sm text-zinc-600">No Checklist found.</p>
        </div>
      );
    }

    if (checklistEither.isRight()) {
      const checklist = checklistEither.extract();

      return <ChecklistForm initialChecklist={checklist} variant="edit" />;
    }
  }
};

export default EditChecklist;
