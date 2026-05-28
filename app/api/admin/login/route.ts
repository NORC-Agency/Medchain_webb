import { NextResponse } from "next/server";

import { setAdminSessionCookie, verifyAdminPassword } from "../../../../lib/auth";

export async function POST(request: Request) {
  let payload: { password?: string };

  try {
    payload = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyAdminPassword(payload.password ?? "")) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  setAdminSessionCookie(response.cookies);
  return response;
}
