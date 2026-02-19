import { NextResponse } from "next/server";

import { readPublicApiDocFile } from "../lib/read-public-api-doc-file";

export const dynamic = "force-static";

export async function GET() {
  const result = await readPublicApiDocFile({
    filename: "public-api.openapi.yaml",
  }).run();

  if (result.isLeft()) {
    return NextResponse.json(
      { error: "Failed to load OpenAPI spec" },
      { status: 500 },
    );
  }

  const spec = result.extract() as string;

  return new NextResponse(spec, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
