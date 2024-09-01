import { EitherAsync } from "purify-ts/EitherAsync";

import { JournalForm } from "../../journal-form";
import { getJournal } from "../../journal.model";
import { CreatedAtLocal } from "../../journal.types";

const EditJournal: React.FC<{ params: { createdAtLocal: string } }> = async ({
  params,
}) => {
  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const createdAtLocal = await liftEither(
      CreatedAtLocal.decode(params.createdAtLocal),
    );

    const journal = await fromPromise(getJournal(createdAtLocal));

    return <JournalForm journal={journal} />;
  })
    .mapLeft((e) => {
      return <p>{String(e)}</p>;
    })
    .run();

  return page.extract();
};

export default EditJournal;
