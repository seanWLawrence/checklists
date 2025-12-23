import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

export const getImageFromFormData = ({
  name,
  formData,
}: {
  name: string;
  formData: FormData;
}): Either<string, File> => {
  return Maybe.fromNullable(formData.get(name))
    .toEither(`Missing ${name}`)
    .chain((x) =>
      x instanceof File ? Right(x) : Left(`'${name}' is wrong type`),
    )
    .chain((file) =>
      file.type.startsWith("image/")
        ? Right(file)
        : Left(`'${name}' is not an image`),
    );
};
