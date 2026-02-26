import { redirect } from "next/navigation";
import { EitherAsync } from "purify-ts/EitherAsync";

import { Audio } from "@/components/audio";
import { Fieldset } from "@/components/fieldset";
import { Heading } from "@/components/heading";
import { Image } from "@/components/image";
import { LinkButton } from "@/components/link-button";
import { buttonClassName } from "@/components/button-classes";
import { getAllItems } from "@/lib/db/get-all-items";
import { scan } from "@/lib/db/scan";
import { getPresignedGetObjectUrl } from "@/lib/aws/s3/get-presigned-get-object-url";
import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import {
  CreatedAtLocal,
  Journal,
  JournalAssetVariant,
} from "../../journal.types";
import { SinceFilterForm } from "../../components/since-filter-form";
import { parseSinceRange } from "../../lib/parse-since-range.lib";
import { prettyDate } from "../../lib/pretty-date.lib";
import { getAllJournalsScanKey } from "../../model/get-all-created-at-locals.model";

export const dynamic = "force-dynamic";

type AssetGalleryItem = {
  filename: string;
  caption: string;
  variant: JournalAssetVariant;
  previewUrl: string;
  createdAtLocal: CreatedAtLocal;
  updatedAtIso: Date;
};

const GROUPS = [
  { key: "image", title: "Photos" },
  { key: "video", title: "Videos" },
  { key: "audio", title: "Audio" },
] as const;

const AssetSection: React.FC<{
  title: string;
  items: AssetGalleryItem[];
}> = ({ title, items }) => {
  return (
    <Fieldset legend={title} className="text-left">
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

    const withPreviewUrls = await fromPromise(
      EitherAsync.all(
        flattenedAssets.map((asset) =>
          EitherAsync(async ({ fromPromise }) => {
            const previewUrl = await fromPromise(
              getPresignedGetObjectUrl({ filename: asset.filename }),
            );

            return {
              ...asset,
              previewUrl,
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
