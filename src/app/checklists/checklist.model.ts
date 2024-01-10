"use server";
import { put, del, list, ListBlobResultBlob } from "@vercel/blob";

import { IChecklist } from "@/lib/types";

const getChecklistUrlById = async (id: string): Promise<string> => {
  const checklists = await list({ prefix: `checklists/${id}.json` });

  const url = checklists.blobs[0].url ?? null;

  return url;
};

export const getChecklistById = async (
  id: string,
): Promise<IChecklist | null> => {
  const url = await getChecklistUrlById(id);

  if (url) {
    return fetch(url, { method: "GET" })
      .then(async (res) => res.json())
      .then((json) => {
        console.log(json);
        return json;
      });
  }

  return null;
};

export const getChecklistsUrls = async (): Promise<string[]> => {
  const checklists = await list({ prefix: `checklists/` });

  return checklists.blobs?.map((b) => b.url) ?? [];
};

export const getChecklists = async (): Promise<IChecklist[] | null> => {
  const urls = await getChecklistsUrls();

  return Promise.all(
    urls.map((url) =>
      fetch(url, { method: "GET" })
        .then(async (res) => res.json())
        .then((json) => {
          console.log(json);
          return json;
        }),
    ),
  );
};

export const deleteChecklistById = async (id: string): Promise<void> => {
  // TODO add user id once we support login
  //
  const url = await getChecklistUrlById(id);

  if (url) {
    await del(url);
  }
};

export const createChecklist = async (checklist: IChecklist): Promise<void> => {
  // TODO add user id once we support login
  const res = await put(
    `checklists/${checklist.id}.json`,
    JSON.stringify(checklist),
    {
      // TODO switch to private once it's supported
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    },
  );
};
