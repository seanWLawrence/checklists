import { Maybe } from "purify-ts/Maybe";

export const getBooleanFromFormData = ({
  name,
  formData,
}: {
  name: string;
  formData: FormData;
}): boolean => {
  return Maybe.fromNullable(formData.get(name))
    .map((x) => typeof x === "string" && x === "on")
    .orDefaultLazy(() => false);
};
