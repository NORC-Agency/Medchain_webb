import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../../lib/auth";
import { deleteRecord, isCollectionName } from "../../../../lib/storage";

type RouteContext = {
  params: Promise<{ collection: string; id: string }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const { collection, id } = await context.params;

  if (!isCollectionName(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  if (!isAdminAuthenticated(await cookies())) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  let deleted;

  try {
    deleted = await deleteRecord(collection, id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete failed because storage is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (!deleted) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: id });
}
