import { Either, Right, Left } from "purify-ts/Either";
import { User, Key } from "@/lib/types";

export const validateUserFromKey = ({
  user,
  key,
}: {
  user: User;
  key: Key;
}): Either<string, User> => {
  const usernameFromKey = key.match(/(?<=user#)[^#]*(?=#)/);

  if (usernameFromKey && user.username === usernameFromKey[0]) {
    return Right(user);
  }

  return Left("Forbidden");
};
