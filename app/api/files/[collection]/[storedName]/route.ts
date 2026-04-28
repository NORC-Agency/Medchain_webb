import { NextResponse } from "next/server";

import { isCollectionName, readStoredFile } from "../../../../../lib/storage";

type RouteContext = {
  params: Promise<{ collection: string; storedName: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { collection, storedName } = await context.params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const payload = await readStoredFile(collection, storedName);
  if (!payload) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(payload.buffer, {
    status: 200,
    headers: {
      "Content-Type": payload.record.type,
      "Content-Length": String(payload.buffer.byteLength),
      "Content-Disposition": `inline; filename="${encodeURIComponent(payload.record.name)}"`,
      "Cache-Control": "no-store",
    },
  });
}
