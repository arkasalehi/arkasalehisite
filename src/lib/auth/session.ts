import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { getDb } from "@/lib/db/client";
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE, authCookieOptions } from "@/lib/auth/cookies";

export { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_COOKIE, authCookieOptions } from "@/lib/auth/cookies";

const ACCESS_TTL = "15m";
const REFRESH_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function sha256Hex(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signAccessToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(secretKey());
}

export async function signRefreshToken(userId: string) {
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256Hex(raw);
  const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
  const db = getDb();
  await db.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(tokenHash)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_DAYS}d`)
    .sign(secretKey());
}

function parseUser(payload: Record<string, unknown>, sub: string): SessionUser | null {
  if (typeof payload.email !== "string") return null;
  return {
    id: sub,
    email: payload.email,
    username: String(payload.username ?? ""),
    displayName: String(payload.displayName ?? ""),
    role: payload.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

export async function verifyAccessToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    if (payload.typ && payload.typ !== "access") return null;
    return parseUser(payload as Record<string, unknown>, payload.sub);
  } catch {
    return null;
  }
}

/** Issue a new access token from a still-valid refresh cookie. Does not rotate the refresh token (avoids parallel-request races). */
export async function refreshAccess(refreshJwt: string): Promise<{ user: SessionUser; access: string } | null> {
  try {
    const { payload } = await jwtVerify(refreshJwt, secretKey());
    if (!payload.sub || payload.typ !== "refresh" || typeof payload.jti !== "string") return null;
    const db = getDb();
    const stored = await db.refreshToken.findUnique({ where: { tokenHash: payload.jti } });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) return null;
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    const session: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
    return { user: session, access: await signAccessToken(session) };
  } catch {
    return null;
  }
}

export async function setAuthCookies(access: string, refresh?: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, authCookieOptions(60 * 15));
  if (refresh) {
    store.set(REFRESH_COOKIE, refresh, authCookieOptions(60 * 60 * 24 * REFRESH_DAYS));
  }
  store.delete(SESSION_COOKIE);
}

export async function clearSessionCookie() {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    try {
      const { payload } = await jwtVerify(refresh, secretKey());
      if (typeof payload.jti === "string") {
        await getDb().refreshToken.deleteMany({ where: { tokenHash: payload.jti } });
      }
    } catch {
      /* ignore */
    }
  }
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
  store.delete(SESSION_COOKIE);
}

export async function issueAuth(user: SessionUser) {
  const [access, refresh] = await Promise.all([signAccessToken(user), signRefreshToken(user.id)]);
  await setAuthCookies(access, refresh);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value || store.get(SESSION_COOKIE)?.value;
  if (access) {
    const user = await verifyAccessToken(access);
    if (user) return user;
  }
  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const next = await refreshAccess(refresh);
  if (!next) return null;
  try {
    await setAuthCookies(next.access);
  } catch {
    /* RSC cookie writes may be blocked; proxy issues the cookie */
  }
  return next.user;
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    const error = new Error("UNAUTHORIZED");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    const error = new Error("FORBIDDEN");
    error.name = "FORBIDDEN";
    throw error;
  }
  return session;
}

export { signAccessToken as signSession };
export { setAuthCookies as setSessionCookie };
