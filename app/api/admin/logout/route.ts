import { NextResponse } from "next/server";

import { clearAdminSessionCookie } from "../../../../lib/auth";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response.cookies);
  return response;
}
