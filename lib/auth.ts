import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "medchain_admin_session";

const ADMIN_PASSWORD = process.env.MEDCHAIN_ADMIN_PASSWORD ?? "medchain-admin";
const SESSION_SECRET = process.env.MEDCHAIN_ADMIN_SESSION_SECRET ?? ADMIN_PASSWORD;
const SESSION_PAYLOAD = "medchain-admin";

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function verifyAdminPassword(password: string) {
  return password === ADMIN_PASSWORD;
}

export function createSessionToken() {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
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
    },
  ): void;
}) {
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
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
    },
  ): void;
}) {
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
