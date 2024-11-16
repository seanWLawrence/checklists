import { EitherAsync } from "purify-ts/EitherAsync";
import { randomChars } from "./random-chars";

export const internal__defaultHashFn = ({
  value,
  salt,
}: {
  value: string;
  salt: string;
}): EitherAsync<unknown, string> => {
  return EitherAsync(async ({ throwE }) => {
    try {
      const encoder = new TextEncoder();

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(value),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode(salt),
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"],
      );

      const exportedKey = await crypto.subtle.exportKey("raw", key);

      return Buffer.from(exportedKey).toString("hex");
    } catch (err) {
      return throwE(err);
    }
  });
};

export interface SecureHashParams {
  value: string;
  saltFn?: typeof randomChars;
  hashFn?: typeof internal__defaultHashFn;
}

export interface SecureHashPayload {
  hash: string;
  salt: string;
}

export const secureHash = ({
  value,
  saltFn = randomChars,
  hashFn = internal__defaultHashFn,
}: SecureHashParams): EitherAsync<unknown, SecureHashPayload> => {
  return EitherAsync(async ({ fromPromise, liftEither }) => {
    const salt = await liftEither(saltFn({}));

    const hash = await fromPromise(hashFn({ value, salt }));

    return { hash, salt };
  });
};
