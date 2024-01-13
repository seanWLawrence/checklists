"use server";
import { put, del, list } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { IChecklist } from "@/lib/types";
import { redirect } from "next/navigation";

const getChecklistUrlById = async (id: string): Promise<string> => {
  const checklists = await list({ prefix: `checklists/${id}.json` });

  const url = checklists.blobs?.[0]?.url ?? null;

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
    await del(url, {});

    revalidatePath("checklists");
  }
};

export const createChecklist = async (checklist: IChecklist): Promise<void> => {
  // TODO add user id once we support login
  await put(`checklists/${checklist.id}.json`, JSON.stringify(checklist), {
    // TODO switch to private once it's supported
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
};

export const updateChecklist = async (checklist: IChecklist): Promise<void> => {
  // TODO add user id once we support login
  await put(`checklists/${checklist.id}.json`, JSON.stringify(checklist), {
    // TODO switch to private once it's supported
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
};

export const onChecklistSave = async ({
  variant,
  checklist,
}: {
  variant: "new" | "edit";
  checklist: IChecklist;
}): Promise<void> => {
  if (variant === "new") {
    await createChecklist(checklist);
  } else {
    await updateChecklist(checklist);
  }
  const checklistIdPath = `/checklists/${checklist.id}`;

  revalidatePath(checklistIdPath);
  revalidatePath(`${checklistIdPath}/edit`);
  revalidatePath("/checklists");
};

export const onCheckboxesSave = async (formData: FormData) => {
  const checklist: IChecklist | null = JSON.parse(
    (formData.get("checklist") as string) ?? "",
  );

  if (checklist) {
    const sections = checklist.sections.map((section) => {
      return {
        ...section,
        items: section.items.map((item) => {
          const completed = formData.get(`item__${item.id}`);

          return { ...item, completed: !!completed };
        }),
      };
    });

    await updateChecklist({ ...checklist, sections });

    const checklistIdRoute = `/checklists/${checklist.id}`;
    revalidatePath(checklistIdRoute);
  }

  redirect("/checklists");
};

export const onCheckboxesReset = async (formData: FormData) => {
  const checklist: IChecklist | null = JSON.parse(
    (formData.get("checklist") as string) ?? "",
  );

  if (checklist) {
    const sections = checklist.sections.map((section) => {
      return {
        ...section,
        items: section.items.map((item) => {
          return { ...item, completed: false };
        }),
      };
    });

    await updateChecklist({ ...checklist, sections });

    const checklistIdRoute = `/checklists/${checklist.id}`;
    revalidatePath(checklistIdRoute);
  }

  redirect("/checklists");
};
