import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Authentication primitives. Authorization = whether the signed-in Supabase Auth
 * user is an admin. Primary source is `app_metadata.role === "admin"`, with an
 * optional server-only allow-list via `ADMIN_EMAILS` (comma-separated) as a
 * safe fallback for first-run setup. No dependency on a secret key for the core
 * authorization check.
 */

function readServerEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

function allowedAdminEmails(): string[] {
  const raw = readServerEnv("ADMIN_EMAILS");
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in Supabase Auth user, or null. Never throws. */
export async function getAuthUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/** True if the user has admin privileges. */
export function hasAdminRole(user: User | null): boolean {
  if (!user) return false;
  const role = (user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (typeof role === "string" && role.toLowerCase() === "admin") return true;
  const allow = allowedAdminEmails();
  if (allow.length > 0 && user.email) {
    if (allow.includes(user.email.toLowerCase())) return true;
  }
  return false;
}

export interface AdminAccountSummary {
  email: string | null;
  userId: string;
}

export interface AdminAuthConfig {
  roleConfigured: boolean;
  allowListCount: number;
  hasAllowList: boolean;
}

/** Describes admin authorization configuration (no privileged DB calls). */
export function describeAdminConfig(): AdminAuthConfig {
  const allow = allowedAdminEmails();
  return {
    roleConfigured: false, // we don't inspect metadata across users here
    allowListCount: allow.length,
    hasAllowList: allow.length > 0,
  };
}
