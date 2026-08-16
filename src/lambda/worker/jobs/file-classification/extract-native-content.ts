const MAX_EXTRACTED_CHARACTERS = 40_000;

const textDecoder = new TextDecoder("utf-8", { fatal: false });

const readSynchsafeInteger = (bytes: Uint8Array): number =>
  ((bytes[0] & 0x7f) << 21) |
  ((bytes[1] & 0x7f) << 14) |
  ((bytes[2] & 0x7f) << 7) |
  (bytes[3] & 0x7f);

const extractMp3Metadata = (body: Uint8Array): string => {
  if (textDecoder.decode(body.slice(0, 3)) !== "ID3" || body.length < 10) {
    return "";
  }
  const tagEnd = Math.min(10 + readSynchsafeInteger(body.slice(6, 10)), body.length);
  const values: string[] = [];
  let offset = 10;
  while (offset + 10 <= tagEnd) {
    const frameId = textDecoder.decode(body.slice(offset, offset + 4));
    const frameSize = (body[offset + 4] << 24) | (body[offset + 5] << 16) | (body[offset + 6] << 8) | body[offset + 7];
    if (!/^[A-Z0-9]{4}$/.test(frameId) || frameSize <= 1 || offset + 10 + frameSize > tagEnd) break;
    if (frameId === "TIT2" || frameId === "TPE1" || frameId === "TALB") {
      const label = frameId === "TIT2" ? "Title" : frameId === "TPE1" ? "Artist" : "Album";
      const value = textDecoder.decode(body.slice(offset + 11, offset + 10 + frameSize)).replace(/\0/g, "").trim();
      if (value) values.push(`${label}: ${value}`);
    }
    offset += 10 + frameSize;
  }
  return values.join("\n");
};

export const extractNativeContent = ({ originalFilename, contentType, body }: { originalFilename: string; contentType?: string; body: Uint8Array }): string => {
  const extension = originalFilename.split(".").pop()?.toLowerCase();
  if (extension === "txt" || contentType?.startsWith("text/plain")) {
    return textDecoder.decode(body).replace(/\u0000/g, "").trim().slice(0, MAX_EXTRACTED_CHARACTERS);
  }
  if (extension === "mp3" || contentType === "audio/mpeg") return extractMp3Metadata(body).slice(0, MAX_EXTRACTED_CHARACTERS);
  return "";
};
