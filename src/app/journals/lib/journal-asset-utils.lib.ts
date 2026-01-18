import { EitherAsync } from "purify-ts/EitherAsync";
import { MaybeAsync } from "purify-ts/MaybeAsync";
import { Maybe } from "purify-ts/Maybe";
import { PutBlobResult } from "@vercel/blob";

import { list } from "@/lib/blob/list";
import { del } from "@/lib/blob/del";
import { copy } from "@/lib/blob/copy";
import { put } from "@/lib/blob/put";
import { CreatedAtLocal } from "../journal.types";

export type JournalAssetType = "images" | "audios";

const ENVIRONMENT = Maybe.fromNullable(process.env.NODE_ENV).orDefault(
  "development",
);

const JOURNAL_ASSET_PREFIX = `${ENVIRONMENT}/journals/assets`;

const stripRandomSuffix = (basename: string): string => {
  const lastDash = basename.lastIndexOf("-");
  if (lastDash === -1) {
    return basename;
  }

  const suffix = basename.slice(lastDash + 1);
  const isRandomSuffix = /^[a-z0-9]{6,}$/i.test(suffix);

  return isRandomSuffix ? basename.slice(0, lastDash) : basename;
};

export const getJournalAssetPrefix = ({
  createdAtLocal,
  assetType,
}: {
  createdAtLocal: CreatedAtLocal;
  assetType: JournalAssetType;
}): string => `${JOURNAL_ASSET_PREFIX}/${assetType}/${createdAtLocal}/`;

export const sanitizeAssetFilename = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  const safe = trimmed.replace(/[^a-z0-9._-]+/g, "-");
  return safe.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};

export const getAssetExtension = (
  filename: string,
  fallback: string,
): string => {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop() : undefined;
  return ext && ext.length <= 8 ? ext.toLowerCase() : fallback;
};

export const getAssetFilename = ({
  caption,
  originalName,
  fallbackExtension,
}: {
  caption: string;
  originalName: string;
  fallbackExtension: string;
}): string => {
  const ext = getAssetExtension(originalName, fallbackExtension);
  const base = caption ? sanitizeAssetFilename(caption) : "";

  if (base.length > 0) {
    return `${base.slice(0, 60)}.${ext}`;
  }

  return originalName;
};

export const getAssetCaptionFromPathname = (pathname: string): string => {
  const raw = decodeURIComponent(pathname.split("/").pop() ?? "");
  const extIndex = raw.lastIndexOf(".");
  const base = extIndex > 0 ? raw.slice(0, extIndex) : raw;
  const cleaned = stripRandomSuffix(base);

  return cleaned.replace(/[-_]+/g, " ").trim();
};

export const uploadJournalAsset = ({
  createdAtLocal,
  assetType,
  file,
  caption,
  fallbackExtension,
}: {
  createdAtLocal: CreatedAtLocal;
  assetType: JournalAssetType;
  file: File;
  caption: string;
  fallbackExtension: string;
}): EitherAsync<unknown, PutBlobResult> => {
  const filename = getAssetFilename({
    caption,
    originalName: file.name,
    fallbackExtension,
  });

  return put({
    pathname: `${getJournalAssetPrefix({ createdAtLocal, assetType })}${filename}`,
    body: file,
    options: {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    },
  });
};

export const getJournalAssetInfo = ({
  createdAtLocal,
  assetType,
}: {
  createdAtLocal: CreatedAtLocal;
  assetType: JournalAssetType;
}): MaybeAsync<{ url: string; caption: string }> => {
  return MaybeAsync(async ({ fromPromise, liftMaybe }) => {
    const listResponse = await fromPromise(
      list({
        options: {
          prefix: getJournalAssetPrefix({ createdAtLocal, assetType }),
        },
      }).toMaybeAsync(),
    );

    const latest = [...listResponse.blobs].sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime(),
    )[0];

    await liftMaybe(Maybe.fromNullable(latest));

    return {
      url: latest.url,
      caption: getAssetCaptionFromPathname(latest.pathname),
    };
  });
};

export const deleteJournalAssets = ({
  createdAtLocal,
  assetType,
}: {
  createdAtLocal: CreatedAtLocal;
  assetType: JournalAssetType;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
    const result = await fromPromise(
      list({
        options: {
          prefix: getJournalAssetPrefix({ createdAtLocal, assetType }),
        },
      }),
    );

    const urls = result.blobs.map((blob) => blob.url);

    if (urls.length === 0) {
      return;
    }

    await fromPromise(del({ urls }));
  });
};

export const moveJournalAssetsIfTheyExist = ({
  fromCreatedAtLocal,
  toCreatedAtLocal,
  assetType,
}: {
  fromCreatedAtLocal: CreatedAtLocal;
  toCreatedAtLocal: CreatedAtLocal;
  assetType: JournalAssetType;
}): EitherAsync<unknown, void> => {
  return EitherAsync(async ({ fromPromise }) => {
    const fromPrefix = getJournalAssetPrefix({
      createdAtLocal: fromCreatedAtLocal,
      assetType,
    });

    const toPrefix = getJournalAssetPrefix({
      createdAtLocal: toCreatedAtLocal,
      assetType,
    });

    const result = await fromPromise(
      list({
        options: { prefix: fromPrefix },
      }),
    );

    if (result.blobs.length === 0) {
      return;
    }

    for (const blob of result.blobs) {
      const suffix = blob.pathname.replace(fromPrefix, "");

      await fromPromise(
        copy({
          fromUrlOrPathname: blob.url,
          toPathname: `${toPrefix}${suffix}`,
          options: {
            access: "public",
            addRandomSuffix: true,
          },
        }),
      );
    }

    await fromPromise(del({ urls: result.blobs.map((blob) => blob.url) }));
  });
};
