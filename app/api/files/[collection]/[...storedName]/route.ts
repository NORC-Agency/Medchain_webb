import { NextResponse } from "next/server";

import { isCollectionName, readStoredFile } from "../../../../../lib/storage";

type RouteContext = {
  params: Promise<{ collection: string; storedName: string[] }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { collection, storedName } = await context.params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const pathname = storedName.join("/");
  const payload = await readStoredFile(collection, pathname);

  if (!payload) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if ("buffer" in payload && payload.buffer) {
    const { buffer, record } = payload;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": record.type,
        "Content-Length": String(buffer.byteLength),
        "Content-Disposition": `inline; filename="${encodeURIComponent(record.name)}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const { stream, contentType, size, record } = payload;

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      "Content-Disposition": `inline; filename="${encodeURIComponent(record.name)}"`,
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
