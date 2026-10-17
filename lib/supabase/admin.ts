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
 * This is required by the dashboard because the storefront tables (products,
 * orders, order_items, store_settings) are protected by Row Level Security and
 * column grants that hide customer and internal data from anonymous/public
 * roles. Every caller MUST first verify the signed-in user is an admin (see
 * `lib/auth/dal.ts`) before using this client.
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
    global: { headers: { "X-Client-Info": "nuri-shop-admin" } },
  });
  return cached;
}
