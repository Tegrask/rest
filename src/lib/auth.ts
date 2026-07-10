import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "session";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-at-least-32-characters-long";
const secret = new TextEncoder().encode(SESSION_SECRET);

export interface SessionUser {
  userId: string;
  email: string;
  name: string | null;
  role: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function verifyNxcodeToken(token: string, appId: string) {
  const endpoint = process.env.NXCODE_API_ENDPOINT || "https://studio-api.nxcode.io";
  const response = await fetch(`${endpoint}/api/sdk/auth/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-App-Id": appId,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { id: string; email: string; name?: string; image?: string };
}
