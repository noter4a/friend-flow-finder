import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { prisma } from "../db.server";
import {
  verifyPassword,
  createSession,
  destroySession,
  getSessionFromCookie,
  type SessionUser,
} from "../auth.server";

// ---------------------------------------------------------------------------
// Get the currently authenticated user (or null)
// ---------------------------------------------------------------------------
export const getAuthUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    return getSessionFromCookie();
  },
);

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
const loginInput = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const loginFn = createServerFn({ method: "POST" })
  .validator(loginInput)
  .handler(async ({ data }) => {
    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user) {
      throw new Error("Usuário ou senha inválidos");
    }

    const valid = await verifyPassword(data.password, user.password);
    if (!valid) {
      throw new Error("Usuário ou senha inválidos");
    }

    await createSession(user.id);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as "admin" | "user",
    };
  });

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
export const logoutFn = createServerFn({ method: "POST" }).handler(
  async () => {
    await destroySession();
    return { ok: true };
  },
);
