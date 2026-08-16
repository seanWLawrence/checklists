import { EitherAsync } from "purify-ts/EitherAsync";

type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export const uploadFileToPresignedUrl = ({
  file,
  uploadUrl,
  fetchFn = fetch,
}: {
  file: File;
  uploadUrl: string;
  fetchFn?: FetchFn;
}): EitherAsync<unknown, void> =>
  EitherAsync(async ({ throwE }) => {
    const response = await fetchFn(uploadUrl, {
      method: "PUT",
      headers: file.type ? { "Content-Type": file.type } : undefined,
      body: file,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return throwE(
        `Failed to upload file (${response.status}): ${errorBody || response.statusText}`,
      );
    }
  });
