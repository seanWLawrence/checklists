import { EitherAsync } from "purify-ts";
import { UUID } from "@/lib/types";
import { getNote } from "../model/get-note.model";
import { Heading } from "@/components/heading";
import { LinkButton } from "@/components/link-button";
import { PrettyContent } from "./pretty-content.client";
import { RelativeTime } from "@/components/relative-time";

type Params = Promise<{ id: string }>;

const NoteView: React.FC<{ params: Params }> = async (props) => {
  const { id } = await props.params;

  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const validId = await liftEither(UUID.decode(id));
    const note = await fromPromise(getNote(validId));

    return (
      <div className="space-y-4 max-w-prose">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Heading level={1}>{note.name}</Heading>

            <LinkButton
              href={`/notes/${note.id}/edit`}
              variant="ghost"
              className="underline underline-offset-2"
            >
              Edit
            </LinkButton>
          </div>
        </div>

        <RelativeTime date={note.updatedAtIso} />

        <PrettyContent content={note.content} />
      </div>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p>No note found with id: {id}</p>
          <p className="text-xs text-red-800">{String(error)}</p>
        </div>
      );
    })
    .run();

  return page.extract();
};

export default NoteView;
