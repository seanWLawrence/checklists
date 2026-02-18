import { NextRequest, NextResponse } from "next/server";

import { ApiTokenScope } from "@/lib/auth/api-token/api-token.types";
import { validateApiToken } from "@/lib/auth/api-token/validate-api-token";
import { User } from "@/lib/types";

export const authorizePublicApiRequest = async ({
  request,
  requiredScope,
}: {
  request: NextRequest;
  requiredScope: ApiTokenScope;
}): Promise<
  | { ok: true; user: User; tokenId: string }
  | { ok: false; response: NextResponse }
> => {
  const authResult = await validateApiToken({
    request,
    requiredScope,
  }).run();

  return authResult
    .mapLeft((error) => {
      return {
        ok: false as const,
        response: NextResponse.json(
          {
            error: error.message,
          },
          { status: error.status },
        ),
      };
    })
    .map((result) => {
      return {
        ok: true as const,
        user: result.user,
        tokenId: result.tokenId,
      };
    })
    .extract();
};
