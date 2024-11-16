import { Either } from "purify-ts";

export const randomBytes = (): Uint8Array => {
  const buffer = new Uint8Array(16);

  crypto.getRandomValues(buffer);

  return buffer;
};

export interface RandomCharsParams {
  randomBytesFn?: () => Uint8Array;
}

export const randomChars = ({
  randomBytesFn = randomBytes,
}: RandomCharsParams): Either<unknown, string> => {
  return Either.encase(() => {
    const bytes = randomBytesFn();

    if (bytes.length === 0) {
      throw new Error("randomBytesFn returned an empty buffer");
    }

    return Buffer.from(bytes).toString("hex");
  });
};
