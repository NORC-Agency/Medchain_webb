import { NextResponse } from "next/server";

import {
  isAdminAuthConfigured,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "../../../../lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const failedLoginAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function getAttemptState(key: string) {
  const now = Date.now();
  const state = failedLoginAttempts.get(key);

  if (!state || now - state.firstAttemptAt > RATE_LIMIT_WINDOW_MS) {
    return { count: 0, firstAttemptAt: now };
  }

  return state;
}

function isRateLimited(key: string) {
  return getAttemptState(key).count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(key: string) {
  const state = getAttemptState(key);
  failedLoginAttempts.set(key, {
    count: state.count + 1,
    firstAttemptAt: state.firstAttemptAt,
  });
}

export async function POST(request: Request) {
  let payload: { password?: string };
  const clientKey = getClientKey(request);

  if (!isAdminAuthConfigured()) {
    return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  }

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "Too many failed login attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    payload = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!verifyAdminPassword(payload.password ?? "")) {
    recordFailedAttempt(clientKey);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  failedLoginAttempts.delete(clientKey);
  setAdminSessionCookie(response.cookies);
  return response;
}
