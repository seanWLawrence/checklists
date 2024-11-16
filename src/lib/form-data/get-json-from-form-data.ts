import { Codec, Either, Maybe, Right, Left } from "purify-ts";

export const getJsonFromFormData = <T extends object>({
  name,
  formData,
  decoder,
}: {
  name: string;
  formData: FormData;
  decoder: Codec<T>;
}): Either<unknown, T> => {
  return Maybe.fromNullable(formData.get(name))
    .toEither(`Missing ${name}`)
    .chain((x) =>
      typeof x === "string" ? Right(x) : Left(`'${name}' is wrong type`),
    )
    .chain((x) =>
      Either.encase(() => JSON.parse(x)).mapLeft(() => "Invalid json"),
    )
    .chain(decoder.decode);
};
