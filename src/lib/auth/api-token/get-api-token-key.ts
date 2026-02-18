import { Key } from "@/lib/types";
import { ApiTokenId } from "./api-token.types";

export const getApiTokenKey = ({
  username,
  id,
}: {
  username: string;
  id: ApiTokenId;
}): Key => `user#${username}#api-token#${id}`;
