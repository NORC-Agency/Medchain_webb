import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "medchain_admin_session";

const SESSION_TTL_SECONDS = 60 * 60 * 24;
const SESSION_PAYLOAD = "medchain-admin";

function getAdminPassword() {
  return process.env.MEDCHAIN_ADMIN_PASSWORD?.trim() || null;
}

function getSessionSecret() {
  return process.env.MEDCHAIN_ADMIN_SESSION_SECRET?.trim() || null;
}

function sign(value: string) {
  const secret = getSessionSecret();
  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(value).digest("hex");
}

function safelyCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthConfigured() {
  return Boolean(getAdminPassword() && getSessionSecret());
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) {
    return false;
  }

  return safelyCompare(password, configuredPassword);
}

export function createSessionToken() {
  const signature = sign(SESSION_PAYLOAD);
  if (!signature) {
    throw new Error("Admin session secret is not configured");
  }

  return `${SESSION_PAYLOAD}.${signature}`;
}

export function isValidSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload !== SESSION_PAYLOAD) {
    return false;
  }

  const expected = sign(payload);
  if (!expected) {
    return false;
  }

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isAdminAuthenticated(cookieStore: {
  get(name: string): { value: string } | undefined;
}) {
  return isValidSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export function setAdminSessionCookie(cookieStore: {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      path: string;
      maxAge: number;
      secure?: boolean;
    },
  ): void;
}) {
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminSessionCookie(cookieStore: {
  set(
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      path: string;
      maxAge: number;
      secure?: boolean;
    },
  ): void;
}) {
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
