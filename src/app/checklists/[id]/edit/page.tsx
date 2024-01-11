import { ChecklistForm } from "../../checklist-form";
import { getChecklistById } from "../../checklist.model";

const EditChecklist: React.FC<{
  params: { id: string };
}> = async ({ params: { id } }) => {
  const checklist = await getChecklistById(id);

  if (!checklist) {
    return (
      <div>
        <p className="text-sm text-zinc-600">No Checklist found.</p>
      </div>
    );
  }

  return <ChecklistForm initialChecklist={checklist} variant="edit" />;
};

export default EditChecklist;
