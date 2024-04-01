import { EitherAsync } from "purify-ts/EitherAsync";
import { Either } from "purify-ts/Either";

import { JournalForm } from "../../journal-form";
import { getJournal } from "../../journal.model";

const EditJournal: React.FC<{ params: { createdAtIso: string } }> = async ({
  params,
}) => {
  const response = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtIso = await liftEither(
      Either.encase(() => new Date(params.createdAtIso)),
    );

    const journal = await fromPromise(getJournal(createdAtIso));

    return <JournalForm journal={journal} />;
  })
    .mapLeft((e) => {
      return <p>{String(e)}</p>;
    })
    .run();

  return response.toJSON();
};

export default EditJournal;
