import { NextResponse } from "next/server";

import { readPublicApiDocFile } from "../lib/read-public-api-doc-file";

export const dynamic = "force-static";

const escapeHtml = (input: string): string =>
  input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export async function GET() {
  const result = await readPublicApiDocFile({
    filename: "public-api.md",
  }).run();

  if (result.isLeft()) {
    return NextResponse.json(
      { error: "Failed to load public API docs" },
      { status: 500 },
    );
  }

  const markdown = result.extract() as string;
  const escapedMarkdown = escapeHtml(markdown);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Public API Docs</title>
    <style>
      :root { color-scheme: light dark; }
      body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 0; padding: 24px; line-height: 1.45; }
      .container { max-width: 900px; margin: 0 auto; }
      h1 { font-size: 20px; margin: 0 0 12px 0; }
      p { margin: 0 0 16px 0; }
      pre { white-space: pre-wrap; word-break: break-word; border: 1px solid #9994; border-radius: 8px; padding: 16px; margin: 0; }
      a { color: inherit; }
    </style>
  </head>
  <body>
    <main class="container">
      <h1>Public API Documentation</h1>
      <p>
        OpenAPI spec:
        <a href="/api/public/v1/openapi.yaml">/api/public/v1/openapi.yaml</a>
      </p>
      <pre>${escapedMarkdown}</pre>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
