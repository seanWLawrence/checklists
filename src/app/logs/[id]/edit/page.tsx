import { EitherAsync } from "purify-ts/EitherAsync";

import { Heading } from "@/components/heading";
import { UUID } from "@/lib/types";
import { LogForm } from "../../components/log-form";
import { getLog } from "../../model/get-log.model";
import { getLogMediaPreviewUrls } from "../../lib/get-log-media-preview-urls";

type Params = Promise<{ id: string }>;

const EditLogPage: React.FC<{ params: Params }> = async ({ params }) => {
  const { id: unsafeId } = await params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(unsafeId));
    const log = await fromPromise(getLog(id));
    const initialMediaPreviewUrlsByBlockKey = await fromPromise(
      getLogMediaPreviewUrls({ blocks: log.blocks }),
    );

    return (
      <main>
        <LogForm
          log={log}
          initialMediaPreviewUrlsByBlockKey={initialMediaPreviewUrlsByBlockKey}
        />
      </main>
    );
  })
    .mapLeft((error) => {
      return (
        <main>
          <section className="space-y-3">
            <Heading level={1}>Edit log</Heading>

            <div className="space-y-2">
              <p>Error loading log.</p>
              <pre className="text-xs text-red-800 max-w-prose">
                {String(error)}
              </pre>
            </div>
          </section>
        </main>
      );
    })
    .run();

  return page.extract();
};

export default EditLogPage;
