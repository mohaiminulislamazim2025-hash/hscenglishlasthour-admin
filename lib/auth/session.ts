import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Authentication primitives. Authentication = who the user is (Supabase Auth).
 * Authorization = whether that user is an admin (`admin_users` allow-list),
 * checked server-side with the privileged client because `admin_users` has no
 * PostgREST access for the `authenticated` role.
 */

const ADMIN_USERS_TABLE = "admin_users";

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

/** True when the given auth user id is present in the `admin_users` allow-list. */
export async function isAdminUserId(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await getSupabaseAdminClient()
      .from(ADMIN_USERS_TABLE)
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

export interface AdminAccount {
  userId: string;
  email: string | null;
  createdAt: string;
}

/**
 * List admin accounts with their emails (email comes from Supabase Auth). Only
 * callable from server code after an admin check. Read-only: the dashboard never
 * grants or revokes admin membership without explicit owner approval.
 */
export async function listAdminAccounts(): Promise<AdminAccount[]> {
  try {
    const admin = getSupabaseAdminClient();
    const { data: rows, error } = await admin
      .from(ADMIN_USERS_TABLE)
      .select("user_id, created_at")
      .order("created_at", { ascending: true });
    if (error || !rows) return [];

    const ids = new Set(rows.map((row) => row.user_id));
    const emailById = new Map<string, string | null>();

    // Look up emails for the (normally tiny) admin allow-list.
    let page = 1;
    const perPage = 200;
    while (page <= 25) {
      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (usersError || !usersPage) break;
      for (const user of usersPage.users) {
        if (ids.has(user.id)) emailById.set(user.id, user.email ?? null);
      }
      if (usersPage.users.length < perPage) break;
      page += 1;
    }

    return rows.map((row) => ({
      userId: row.user_id,
      email: emailById.get(row.user_id) ?? null,
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

/** Number of rows in the admin allow-list (used for first-run setup guidance). */
export async function countAdmins(): Promise<number> {
  try {
    const { count, error } = await getSupabaseAdminClient()
      .from(ADMIN_USERS_TABLE)
      .select("user_id", { count: "exact", head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}
