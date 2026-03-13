import { EitherAsync } from "purify-ts/EitherAsync";
import Link from "next/link";

import { Fieldset } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { RelativeTime } from "@/components/relative-time";
import { Audio } from "@/components/audio";
import { Image } from "@/components/image";
import { Video } from "@/components/video";
import { UUID } from "@/lib/types";
import { getLog } from "../model/get-log.model";
import { Block } from "../log.types";
import { getLogMediaPreviewUrls } from "../lib/get-log-media-preview-urls";

const isMediaBlock = (
  block: Block,
): block is Extract<Block, { variant: "audio" | "image" | "video" }> => {
  return (
    block.variant === "audio" ||
    block.variant === "image" ||
    block.variant === "video"
  );
};

const EmptyValue: React.FC = () => {
  return <p className="text-xs text-zinc-500 dark:text-zinc-400">Empty</p>;
};

type Params = Promise<{ id: string }>;

const LogPage: React.FC<{ params: Params }> = async ({ params }) => {
  const { id: unsafeId } = await params;

  const page = await EitherAsync(async ({ liftEither, fromPromise }) => {
    const id = await liftEither(UUID.decode(unsafeId));
    const log = await fromPromise(getLog(id));

    const previewUrls = await fromPromise(
      getLogMediaPreviewUrls({
        sections: log.sections,
      }),
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

        {log.sections.length === 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No sections yet.
          </p>
        )}

        {log.sections.map((section, sectionIndex) => (
          <Fieldset key={`${section.name}-${sectionIndex}`} legend={section.name}>
            <div className="space-y-4">
              {section.blocks.map((block, blockIndex) => {
                const mediaPreviewUrl =
                  previewUrls[`${sectionIndex}-${blockIndex}`];

                return (
                  <div key={blockIndex} className="space-y-1">
                    {block.variant === "checkbox" && (
                      <label className="flex w-full items-center gap-2 text-sm">
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
                      block.value.trim() !== "" ? (
                        <p className="text-sm">{block.value}</p>
                      ) : (
                        <EmptyValue />
                      )
                    )}

                    {block.variant === "longText" && (
                      block.value.trim() !== "" ? (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {block.value}
                        </p>
                      ) : (
                        <EmptyValue />
                      )
                    )}

                    {block.variant === "number" && (
                      Number.isFinite(block.value) ? (
                        <p className="text-sm">{block.value}</p>
                      ) : (
                        <EmptyValue />
                      )
                    )}

                    {isMediaBlock(block) && (
                      <div className="space-y-2">
                        {block.value.trim() === "" ? (
                          <EmptyValue />
                        ) : mediaPreviewUrl ? (
                          <div className="space-y-1">
                            {block.variant === "image" && (
                              <Image src={mediaPreviewUrl} alt="" />
                            )}
                            {block.variant === "audio" && (
                              <Audio src={mediaPreviewUrl} />
                            )}
                            {block.variant === "video" && (
                              <Video src={mediaPreviewUrl} />
                            )}
                          </div>
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
