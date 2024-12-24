import { EitherAsync } from "purify-ts";
import { UUID } from "@/lib/types";
import { NoteForm } from "../../components/note-form";
import { getNote } from "../../model/get-note.model";

type Params = Promise<{ id: string }>;

const EditNote: React.FC<{ params: Params }> = async (props) => {
  const { id } = await props.params;

  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const validId = await liftEither(UUID.decode(id));
    const checklist = await fromPromise(getNote(validId));

    return (
      <main>
        <NoteForm note={checklist} />
      </main>
    );
  }).mapLeft((error) => {
    return (
      <div className="space-y-2">
        <p>No note found with id: {id}</p>
        <p className="text-xs text-red-800">{String(error)}</p>
      </div>
    );
  });

  return page.extract();
};

export default EditNote;
