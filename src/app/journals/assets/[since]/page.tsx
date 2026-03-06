import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Audio } from "@/components/audio";
import { Fieldset } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { Image } from "@/components/image";
import { LinkButton } from "@/components/link-button";
import { BrowserLocalAssetTime } from "@/components/browser-local-asset-time";
import { SubmitButton } from "@/components/submit-button";
import { buttonClassName } from "@/components/button-classes";
import { getAllItems } from "@/lib/redis/get-all-items";
import { scan } from "@/lib/redis/scan";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { listObjects } from "@/lib/aws/s3/list-objects";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import {
  CreatedAtLocal,
  Journal,
  JournalAssetVariant,
} from "../../journal.types";
import { SinceFilterForm } from "../../components/since-filter-form";
import { parseSinceRange } from "../../lib/parse-since-range.lib";
import { prettyDate } from "../../lib/pretty-date.lib";
import { getJournalAssetResponseContentType } from "../../lib/get-journal-asset-response-content-type.lib";
import { getAllJournalsScanKey } from "../../model/get-all-created-at-locals.model";
import { attachOrphanedAssetAction } from "../../actions/attach-orphaned-asset.action";

export const dynamic = "force-dynamic";

type AssetGalleryItem = {
  filename: string;
  caption: string;
  variant: JournalAssetVariant;
  previewUrl: string;
  createdAtLocal: CreatedAtLocal;
  updatedAtIso: Date;
};

type OrphanedAssetItem = {
  filename: string;
  previewUrl: string;
  variant: JournalAssetVariant;
  lastModifiedIso: string;
};

const GROUPS = [
  { key: "image", title: "Photos" },
  { key: "video", title: "Videos" },
  { key: "audio", title: "Audio" },
] as const;

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
]);
const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "m4a",
  "aac",
  "wav",
  "ogg",
  "opus",
  "flac",
  "webm",
]);
const ORPHANED_ASSET_MIN_AGE_MS = 60 * 60 * 1000;

const getAssetVariantFromFilename = (
  filename: string,
): JournalAssetVariant | null => {
  const extension = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase()
    : null;

  if (!extension) {
    return null;
  }

  if (IMAGE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (AUDIO_EXTENSIONS.has(extension)) {
    return "audio";
  }

  return null;
};

const AssetSection: React.FC<{
  title: string;
  items: AssetGalleryItem[];
}> = ({ title, items }) => {
  return (
    <Fieldset legend={title} className="text-left max-w-prose">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          No {title.toLowerCase()} in this range.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((asset) => (
            <article
              key={`${asset.createdAtLocal}-${asset.filename}`}
              className="space-y-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{asset.caption}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {asset.filename}
                  </p>
                </div>
              </div>

              {asset.variant === "image" && (
                <Image src={asset.previewUrl} alt={asset.caption} />
              )}

              {asset.variant === "audio" && <Audio src={asset.previewUrl} />}

              <div className="flex w-full justify-end gap-2">
                <LinkButton
                  href={`/journals/${asset.createdAtLocal}`}
                  variant="ghost"
                  className="shrink-0 max-w-content"
                >
                  View ({prettyDate(asset.createdAtLocal)})
                </LinkButton>

                <a
                  href={asset.previewUrl}
                  download={asset.filename}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClassName({ variant: "outline" })}
                >
                  <span className="text-nowrap whitespace-nowrap">
                    Download
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </Fieldset>
  );
};

const OrphanedAssetsSection: React.FC<{
  items: OrphanedAssetItem[];
  since: string;
}> = ({ items, since }) => {
  return (
    <Fieldset legend="Unreferenced assets" className="text-left max-w-prose">
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {items.length} unreferenced asset{items.length === 1 ? "" : "s"} older
        than 1 hour.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Nothing to review.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((asset) => (
            <article
              key={asset.filename}
              className="space-y-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="space-y-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{asset.filename}</p>
                </div>
              </div>

              {asset.variant === "image" && (
                <Image src={asset.previewUrl} alt={asset.filename} />
              )}

              {asset.variant === "audio" && <Audio src={asset.previewUrl} />}

              <form
                action={async (formData) => {
                  "use server";

                  await attachOrphanedAssetAction({ formData });
                }}
                className="space-y-3"
              >
                <input type="hidden" name="filename" value={asset.filename} />
                <input type="hidden" name="variant" value={asset.variant} />
                <input type="hidden" name="since" value={since} />

                <BrowserLocalAssetTime
                  lastModifiedIso={asset.lastModifiedIso}
                  inputName="createdAtLocal"
                />

                <p className="text-xs text-zinc-600 dark:text-zinc-300">
                  Caption defaults to the filename. The selected journal must
                  already exist.
                </p>

                <div className="flex w-full justify-end gap-2">
                  <SubmitButton variant="outline">
                    Attach to journal
                  </SubmitButton>
                </div>
              </form>

              <div className="flex w-full justify-end gap-2">
                <a
                  href={asset.previewUrl}
                  download={asset.filename}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClassName({ variant: "outline" })}
                >
                  <span className="text-nowrap whitespace-nowrap">
                    Download
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </Fieldset>
  );
};

const JournalAssetsPage: React.FC<{
  params: Promise<{ since: string }>;
}> = async ({ params }) => {
  const { since: unsafeSince } = await params;

  const page = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const { since, from, to } = await liftEither(parseSinceRange(unsafeSince));
    const user = await fromPromise(validateUserLoggedIn({}));
    const validatedKeys = await fromPromise(
      scan({
        key: getAllJournalsScanKey({ user }),
      }),
    );
    const journals = await fromPromise(
      getAllItems({ keys: validatedKeys, decoder: Journal }),
    );
    const allS3Objects = await fromPromise(listObjects());

    const filteredJournals = journals.filter((journal) => {
      return from <= journal.createdAtLocal && journal.createdAtLocal <= to;
    });

    const flattenedAssets = filteredJournals.flatMap((journal) => {
      return (journal.assets ?? []).map((asset) => ({
        ...asset,
        createdAtLocal: journal.createdAtLocal,
        updatedAtIso: journal.updatedAtIso,
      }));
    });
    const referencedAssetFilenames = new Set(
      journals.flatMap((journal) =>
        (journal.assets ?? []).map((asset) => asset.filename),
      ),
    );
    const orphanedAssetCandidates = allS3Objects
      .filter((object) => !referencedAssetFilenames.has(object.key))
      .filter((object) => {
        if (!object.lastModified) {
          return false;
        }

        return (
          Date.now() - object.lastModified.getTime() >=
          ORPHANED_ASSET_MIN_AGE_MS
        );
      })
      .map((object) => ({
        filename: object.key,
        variant: getAssetVariantFromFilename(object.key),
        lastModified: object.lastModified!,
      }))
      .filter(
        (
          object,
        ): object is {
          filename: string;
          variant: JournalAssetVariant;
          lastModified: Date;
        } => object.variant !== null,
      );

    const withPreviewUrls = await fromPromise(
      EitherAsync.all(
        flattenedAssets.map((asset) =>
          EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({
                filename: asset.filename,
                responseContentType: getJournalAssetResponseContentType({
                  filename: asset.filename,
                }),
              }),
            );

            return {
              ...asset,
              previewUrl,
            };
          }),
        ),
      ),
    );
    const orphanedAssets = await fromPromise(
      EitherAsync.all(
        orphanedAssetCandidates.map((asset) =>
          EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({
                filename: asset.filename,
                responseContentType: getJournalAssetResponseContentType({
                  filename: asset.filename,
                }),
              }),
            );

            return {
              filename: asset.filename,
              previewUrl,
              variant: asset.variant,
              lastModifiedIso: asset.lastModified.toISOString(),
            };
          }),
        ),
      ),
    );

    const sortedAssets = [...withPreviewUrls].sort((a, b) => {
      const byUpdated = b.updatedAtIso.getTime() - a.updatedAtIso.getTime();
      if (byUpdated !== 0) {
        return byUpdated;
      }

      return a.filename.localeCompare(b.filename);
    });

    const imageAssets = sortedAssets.filter(
      (asset) => asset.variant === "image",
    );
    const audioAssets = sortedAssets.filter(
      (asset) => asset.variant === "audio",
    );
    const videoAssets: AssetGalleryItem[] = [];
    const sortedOrphanedAssets = [...orphanedAssets].sort((a, b) =>
      b.lastModifiedIso.localeCompare(a.lastModifiedIso),
    );

    return (
      <main className="space-y-4">
        <Heading level={1}>Journal assets</Heading>

        <SinceFilterForm
          className="flex max-w-fit items-end space-x-2"
          action={async (formData) => {
            "use server";
            const sinceRaw = formData.get("since");
            const nextSince =
              typeof sinceRaw === "string" &&
              parseSinceRange(sinceRaw.trim()).isRight()
                ? sinceRaw.trim()
                : since;

            redirect(`/journals/assets/${nextSince}`);
          }}
          defaultSince={since}
        />

        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {sortedAssets.length} asset{sortedAssets.length === 1 ? "" : "s"} from{" "}
          {filteredJournals.length} journal
          {filteredJournals.length === 1 ? "" : "s"} in range.
        </p>

        <div className="space-y-6">
          <AssetSection title={GROUPS[0].title} items={imageAssets} />
          <AssetSection title={GROUPS[1].title} items={videoAssets} />
          <AssetSection title={GROUPS[2].title} items={audioAssets} />
          <OrphanedAssetsSection items={sortedOrphanedAssets} since={since} />
        </div>
      </main>
    );
  })
    .mapLeft((error) => {
      return (
        <div className="space-y-2">
          <p className="text-sm text-zinc-600">
            Failed to load journal assets.
          </p>
          <pre className="text-xs text-red-800">{String(error)}</pre>
        </div>
      );
    })
    .run();

  return page.extract();
};

export default JournalAssetsPage;
