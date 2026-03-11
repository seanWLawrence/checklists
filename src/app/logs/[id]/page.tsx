import { EitherAsync } from "purify-ts/EitherAsync";
import Link from "next/link";

import { Fieldset } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { RelativeTime } from "@/components/relative-time";
import { Audio } from "@/components/audio";
import { Image } from "@/components/image";
import { Video } from "@/components/video";
import { UUID } from "@/lib/types";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { getJournalAssetResponseContentType } from "@/app/journals/lib/get-journal-asset-response-content-type.lib";
import { getLog } from "../model/get-log.model";
import { Block } from "../log.types";

const isMediaBlock = (
  block: Block,
): block is Extract<Block, { variant: "audio" | "image" | "video" }> => {
  return (
    block.variant === "audio" ||
    block.variant === "image" ||
    block.variant === "video"
  );
};

type Params = Promise<{ id: string }>;

const LogPage: React.FC<{ params: Params }> = async ({ params }) => {
  const { id: unsafeId } = await params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(unsafeId));
    const log = await fromPromise(getLog(id));

    const mediaEntries = log.sections.flatMap((section, sectionIndex) =>
      section.blocks.flatMap((block, blockIndex) =>
        isMediaBlock(block) && block.value.trim() !== ""
          ? [{ sectionIndex, blockIndex, filename: block.value }]
          : [],
      ),
    );

    const previewUrls = await fromPromise(
      EitherAsync.all(
        mediaEntries.map(({ sectionIndex, blockIndex, filename }) =>
          EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({
                filename,
                responseContentType: getJournalAssetResponseContentType({
                  filename,
                }),
              }),
            );

            return {
              key: `${sectionIndex}-${blockIndex}`,
              previewUrl,
            };
          }),
        ),
      ).map((items) => new Map(items.map((item) => [item.key, item.previewUrl]))),
    );

    return (
      <main className="space-y-3 max-w-prose">
        <div className="flex flex-col space-y-1 pb-4">
          <div className="flex space-x-2 items-center">
            <Heading level={1}>{log.name}</Heading>

            <Link
              className="underline underline-offset-2 text-xs"
              href="/logs"
            >
              Back
            </Link>
          </div>

          <RelativeTime date={log.updatedAtIso} />
        </div>

        {log.sections.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No sections yet.
          </p>
        )}

        {log.sections.map((section, sectionIndex) => (
          <Fieldset key={`${section.name}-${sectionIndex}`} legend={section.name}>
            <div className="space-y-4">
              {section.blocks.map((block, blockIndex) => {
                const mediaPreviewUrl = previewUrls.get(
                  `${sectionIndex}-${blockIndex}`,
                );

                return (
                  <div key={`${block.name}-${blockIndex}`} className="space-y-1">
                    <div className="text-xs text-zinc-600 dark:text-zinc-300">
                      {block.name}
                    </div>

                    {block.variant === "checkbox" && (
                      <label className="flex w-full items-center gap-2 rounded border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={block.value}
                          readOnly
                          className="accent-blue-500"
                        />
                        <span>{block.value ? "Checked" : "Not checked"}</span>
                      </label>
                    )}

                    {block.variant === "shortText" && (
                      <p className="text-sm">{block.value}</p>
                    )}

                    {block.variant === "longText" && (
                      <pre className="whitespace-pre-wrap break-words text-sm font-sans">
                        {block.value}
                      </pre>
                    )}

                    {block.variant === "number" && (
                      <p className="text-sm">{block.value}</p>
                    )}

                    {isMediaBlock(block) && (
                      <div className="space-y-2">
                        {mediaPreviewUrl ? (
                          <>
                            {block.variant === "image" && (
                              <Image src={mediaPreviewUrl} alt={block.name} />
                            )}
                            {block.variant === "audio" && (
                              <Audio src={mediaPreviewUrl} />
                            )}
                            {block.variant === "video" && (
                              <Video src={mediaPreviewUrl} />
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-zinc-600 dark:text-zinc-300">
                            No file attached.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Fieldset>
        ))}
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
