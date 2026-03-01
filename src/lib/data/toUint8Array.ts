import { Readable } from "node:stream";

export const toUint8Array = async (body: unknown): Promise<Uint8Array> => {
  if (body instanceof Uint8Array) {
    return body;
  }

  if (typeof body === "string") {
    return new TextEncoder().encode(body);
  }

  if (body instanceof Blob) {
    return new Uint8Array(await body.arrayBuffer());
  }

  if (body && typeof (body as ReadableStream).getReader === "function") {
    const buffer = await new Response(body as ReadableStream).arrayBuffer();
    return new Uint8Array(buffer);
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return new Uint8Array(Buffer.concat(chunks));
  }

  throw new Error("Unsupported S3 body type");
};
