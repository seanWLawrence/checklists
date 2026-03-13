import { EitherAsync } from "purify-ts/EitherAsync";
import Link from "next/link";

import { Heading } from "@/components/heading";
import { RelativeTime } from "@/components/relative-time";
import { AssetPreview } from "@/components/asset-preview";
import { UUID } from "@/lib/types";
import { getLog } from "../model/get-log.model";
import { getLogMediaPreviewUrls } from "../lib/get-log-media-preview-urls";
import { PrettyContent } from "@/app/notes/[id]/pretty-content.client";

type Params = Promise<{ id: string }>;

const LogPage: React.FC<{ params: Params }> = async ({ params }) => {
  const { id: unsafeId } = await params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(unsafeId));
    const log = await fromPromise(getLog(id));

    const previewUrls = await fromPromise(
      getLogMediaPreviewUrls({ blocks: log.blocks }),
    );

    return (
      <main className="space-y-3 max-w-prose">
        <div className="flex flex-col space-y-1 pb-4">
          <div className="flex space-x-2 items-center">
            <Heading level={1}>{log.name}</Heading>

            <Link
              className="underline underline-offset-2 text-xs"
              href={`/logs/${log.id}/edit`}
            >
              Edit
            </Link>
          </div>

          <RelativeTime date={log.updatedAtIso} />
        </div>

        {log.blocks.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No blocks yet.
          </p>
        )}

        <div className="space-y-4">
          {log.blocks.map((block, blockIndex) => {
            const mediaPreviewUrl = previewUrls[`${blockIndex}`];

            return (
              <div key={blockIndex}>
                {block.variant === "shortMarkdown" && (
                  block.value.trim() !== "" ? (
                    <PrettyContent content={block.value} />
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Empty</p>
                  )
                )}

                {block.variant === "longMarkdown" && (
                  block.value.trim() !== "" ? (
                    <PrettyContent content={block.value} />
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Empty</p>
                  )
                )}

                {block.variant === "asset" && (
                  mediaPreviewUrl ? (
                    <AssetPreview
                      assetVariant={block.assetVariant}
                      previewUrl={mediaPreviewUrl}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      No file attached.
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      </main>
    );
  })
    .mapLeft((error) => {
      return <p>{String(error)}</p>;
    })
    .run();

  return page.extract();
};

export default LogPage;
