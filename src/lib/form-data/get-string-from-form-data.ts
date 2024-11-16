import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

export const getStringFromFormData = ({
  name,
  formData,
}: {
  name: string;
  formData: FormData;
}): Either<string, string> => {
  return Maybe.fromNullable(formData.get(name))
    .toEither(`Missing ${name}`)
    .chain((x) =>
      typeof x === "string" ? Right(x) : Left(`'${name}' is wrong type`),
    );
};
