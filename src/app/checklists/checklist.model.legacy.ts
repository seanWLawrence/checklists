"use server";
import { put, del, list } from "@vercel/blob";
import { revalidatePath } from "next/cache";

import { IChecklist } from "@/lib/types";
import { RedirectType, redirect } from "next/navigation";
import { getUser } from "@/lib/auth.model";

const getChecklistUrlById = async (id: string): Promise<string> => {
  const user = getUser();

  if (!user) {
    redirect("/login");
  }

  const checklists = await list({
    prefix: `checklists/${user.username}/${id}.json`,
  });

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
  const user = getUser();

  if (!user) {
    redirect("/login");
  }

  const checklists = await list({ prefix: `checklists/${user.username}/` });

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

    revalidatePath("/checklists");
    revalidatePath(`/checklists/${id}`);
    revalidatePath(`/checklists/${id}/edit`);
    redirect("/checklists", RedirectType.push);
  }
};

export const createChecklist = async (checklist: IChecklist): Promise<void> => {
  const user = getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO add user id once we support login
  await put(
    `checklists/${user.username}/${checklist.id}.json`,
    JSON.stringify(checklist),
    {
      // TODO switch to private once it's supported
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    },
  );

  revalidatePath("/checklists");
  redirect(`/checklists/${checklist.id}`, RedirectType.push);
};

export const updateChecklist = async (checklist: IChecklist): Promise<void> => {
  const user = getUser();

  if (!user) {
    redirect("/login");
  }

  // TODO add user id once we support login
  await put(
    `checklists/${user.username}/${checklist.id}.json`,
    JSON.stringify(checklist),
    {
      // TODO switch to private once it's supported
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    },
  );

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${checklist.id}`);
  revalidatePath(`/checklists/${checklist.id}/edit`);
  redirect(`/checklists`, RedirectType.push);
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

  redirect(`/checklists/${checklist.id}`, RedirectType.push);
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
  }
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
  }
};
