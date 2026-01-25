import { Maybe } from "purify-ts/Maybe";

export const ENVIRONMENT = Maybe.fromNullable(process.env.NODE_ENV).orDefault(
  "development",
);

export const isProduction = () => process.env.NODE_ENV === "production";
