import { EitherAsync } from "purify-ts/EitherAsync";
import { getSingleItem } from "@/lib/db/get-single-item";
import { ChecklistV2 } from "../checklist-v2.types";
import { ChecklistShareAccess } from "../checklist-share.types";
import { getChecklistShareKey } from "./get-checklist-share-key";
import { constantTimeStringComparison } from "@/lib/auth/constant-time-string-comparison";
import { getChecklistV2Key } from "./get-checklist-v2.model";
import { secureHashSha256 } from "@/lib/auth/secure-hash-sha256";

export const getChecklistV2ByShareToken = ({
  token,
  getSingleItemFn = getSingleItem,
}: {
  token: string;
  getSingleItemFn?: typeof getSingleItem;
}): EitherAsync<unknown, ChecklistV2> => {
  return EitherAsync(async ({ fromPromise, throwE, liftEither }) => {
    const hashedToken = await liftEither(secureHashSha256(token));

    const shareAccess = await fromPromise(
      getSingleItemFn({
        key: getChecklistShareKey({ hash: hashedToken }),
        decoder: ChecklistShareAccess,
      }),
    );

    const hashesMatch = constantTimeStringComparison(
      hashedToken,
      shareAccess.hash,
    );

    if (!hashesMatch) {
      return throwE("Share token hash doesn't match");
    }

    if (shareAccess.expiresAtIso.getTime() <= Date.now()) {
      return throwE("Share link expired");
    }

    return fromPromise(
      getSingleItemFn({
        key: getChecklistV2Key({
          id: shareAccess.checklistId,
          user: shareAccess.user,
        }),
        decoder: ChecklistV2,
      }),
    );
  });
};
