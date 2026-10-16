import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getAuthUser, isAdminUserId } from "./session";

export interface AdminSession {
  user: User;
  userId: string;
  email: string | null;
}

/**
 * Secure authorization check. Returns the admin session or null. Does not
 * redirect — use this inside Server Actions and Route Handlers so callers can
 * return a proper error response.
 *
 * Memoized per render pass with React `cache` so multiple calls in one render
 * hit Supabase once.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  const isAdmin = await isAdminUserId(user.id);
  if (!isAdmin) return null;
  return { user, userId: user.id, email: user.email ?? null };
});

/**
 * Page/route guard. Redirects to /login when unauthenticated and to
 * /unauthorized when authenticated but not an admin. Deny by default.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const isAdmin = await isAdminUserId(user.id);
  if (!isAdmin) redirect("/unauthorized");
  return { user, userId: user.id, email: user.email ?? null };
}

/** Thrown by server actions when the caller is not an authorized admin. */
export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Server-action guard. Throws `AuthorizationError` when not an admin. */
export async function requireAdminAction(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new AuthorizationError();
  return session;
}
