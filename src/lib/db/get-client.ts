import { kv } from "@vercel/kv";
import { Redis } from "@upstash/redis";
import { Either } from "purify-ts/Either";

export type Client = Redis | typeof kv;

let client: Client | null = null;

export const getClient = ({
  getDevClientFn = () =>
    new Redis({ url: "http://localhost:8079", token: "example_token" }),
  getProdClientFn = () => kv,
}: {
  getDevClientFn?: () => Redis;
  getProdClientFn?: () => typeof kv;
}): Either<unknown, Client> => {
  return Either.encase(() => {
    if (client !== null) {
      return client;
    }

    if (process.env.NODE_ENV !== "production") {
      client = getDevClientFn();
    } else {
      client = getProdClientFn();
    }

    return client;
  });
};

export const __clearClientCache_forTestingOnly = () => {
  client = null;
};
