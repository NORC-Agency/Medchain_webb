import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "../../../../lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  return NextResponse.json({
    authenticated: isAdminAuthenticated(cookieStore),
  });
}
