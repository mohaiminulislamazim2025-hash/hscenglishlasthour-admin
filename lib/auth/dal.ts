import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getAuthUser, hasAdminRole } from "./session";

export interface AdminSession {
  user: User;
  userId: string;
  email: string | null;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  if (!hasAdminRole(user)) return null;
  return { user, userId: user.id, email: user.email ?? null };
});

export async function requireAdmin(): Promise<AdminSession> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!hasAdminRole(user)) redirect("/unauthorized");
  return { user, userId: user.id, email: user.email ?? null };
}

export class AuthorizationError extends Error {
  constructor(message = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAdminAction(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new AuthorizationError();
  return session;
}
