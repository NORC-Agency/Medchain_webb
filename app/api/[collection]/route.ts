import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../lib/auth";
import { isCollectionName, listRecords, uploadFiles } from "../../../lib/storage";

type RouteContext = {
  params: Promise<{ collection: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_: Request, context: RouteContext) {
  const { collection } = await context.params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const records = await listRecords(collection);
  return NextResponse.json(records, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { collection } = await context.params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  if (!isAdminAuthenticated(await cookies())) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  try {
    const records = await uploadFiles(collection, files);
    return NextResponse.json(records, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed because storage is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
