import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getSupabaseSecretKey,
  getSupabaseUrl,
  MISSING_SUPABASE_MESSAGE,
} from "./config";

/**
 * Privileged server-only Supabase client (secret / service_role key). Bypasses
 * Row Level Security and column-level grants.
 *
 * This is required by the dashboard because the public catalog column grants
 * intentionally hide internal Storage paths (`pdf_storage_path`,
 * `cover_image_path`, `book_pages.storage_path`) from the `authenticated` role,
 * and `admin_users` has no PostgREST access at all. Every caller MUST first
 * verify the signed-in user is an admin (see `lib/auth/dal.ts`) before using
 * this client.
 *
 * Never import this module into a Client Component.
 */
let cached: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = getSupabaseUrl();
  const key = getSupabaseSecretKey();
  if (!url || !key) {
    throw new Error(MISSING_SUPABASE_MESSAGE);
  }

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "hscenglishlasthour-admin" } },
  });
  return cached;
}
