import { prisma } from "./db.server";
import bcrypt from "bcryptjs";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE = "guri-session";
const SESSION_EXPIRY_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: "admin" | "user";
};

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  let sessionId: string | undefined;
  try {
    sessionId = getCookie(SESSION_COOKIE);
  } catch {
    return null;
  }
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
    try {
      deleteCookie(SESSION_COOKIE);
    } catch {}
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role: session.user.role as "admin" | "user",
  };
}

export async function createSession(userId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  // Clean up old sessions for this user
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  setCookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: false, // Permitir login via HTTP (IP direto)
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });

  return session;
}

export async function destroySession() {
  let sessionId: string | undefined;
  try {
    sessionId = getCookie(SESSION_COOKIE);
  } catch {
    return;
  }
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  try {
    deleteCookie(SESSION_COOKIE);
  } catch {}
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionFromCookie();
  if (!user) throw new Error("Não autenticado");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Acesso negado");
  return user;
}
