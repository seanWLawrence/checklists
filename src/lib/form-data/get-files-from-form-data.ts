import { Either, Left, Right } from "purify-ts/Either";
import { Maybe } from "purify-ts/Maybe";

export const getFilesFromFormData = ({
  name,
  formData,
}: {
  name: string;
  formData: FormData;
}): Either<string, File[]> => {
  return Maybe.fromNullable(formData.getAll(name))
    .toEither(`Missing ${name}`)
    .chain((files) =>
      files.every((file) => file instanceof File)
        ? Right(files as File[])
        : Left(`'${name}' is wrong type`),
    )
    .map((files) => files.filter((file) => file.size > 0));
};
