"use server";

import { EitherAsync } from "purify-ts";

import { validateUserLoggedIn } from "@/lib/auth/validate-user-logged-in";
import { getStringFromFormData } from "@/lib/form-data/get-string-from-form-data";
import { UUID } from "@/lib/types";
import { randomChars } from "@/lib/auth/random-chars";
import { createItem } from "@/lib/db/create-item";
import { BASE_URL } from "@/lib/constants";
import { ChecklistShareAccess } from "../checklist-share.types";
import { getChecklistShareKey } from "../model/get-checklist-share-key";
import { getChecklistV2 } from "../model/get-checklist-v2.model";
import { secureHashSha256 } from "@/lib/auth/secure-hash-sha256";

const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type ChecklistShareLinkState = {
  url: string;
  expiresAtIso: string;
  error: string;
};

export const createChecklistShareLinkAction = async (
  _prevState: ChecklistShareLinkState,
  formData: FormData,
): Promise<ChecklistShareLinkState> => {
  const response = await EitherAsync(async ({ fromPromise, liftEither }) => {
    const user = await fromPromise(
      validateUserLoggedIn({ variant: "server-action" }),
    );

    const checklistId = await liftEither(
      getStringFromFormData({ name: "checklistId", formData }).chain(
        UUID.decode,
      ),
    );

    await fromPromise(getChecklistV2(checklistId));

    const token = await liftEither(randomChars({}));
    const hash = await liftEither(secureHashSha256(token));

    const now = new Date();
    const expiresAtIso = new Date(now.getTime() + ONE_DAY_IN_MILLISECONDS);

    const shareAccess = await liftEither(
      ChecklistShareAccess.decode({
        checklistId,
        hash,
        createdAtIso: now.toISOString(),
        expiresAtIso: expiresAtIso.toISOString(),
        user,
      }),
    );

    await fromPromise(
      createItem({
        item: shareAccess,
        getKeyFn: () => getChecklistShareKey({ hash }),
      }),
    );

    const shareUrl = new URL("/checklists/share", BASE_URL);
    shareUrl.searchParams.set("token", token);

    return {
      url: shareUrl.toString(),
      expiresAtIso: expiresAtIso.toISOString(),
      error: "",
    };
  });

  if (response.isRight()) {
    return response.extract();
  }

  return {
    url: "",
    expiresAtIso: "",
    error: String(response.extract()),
  };
};
