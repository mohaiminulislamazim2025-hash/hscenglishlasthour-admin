"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./config";

/**
 * Browser Supabase client. Used only for Auth session handling and for direct
 * uploads to private Storage through short-lived signed upload URLs. Only the
 * publishable/anon key is ever used here; the secret key never reaches the
 * browser.
 */
let cached: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (cached) return cached;
  const config = getSupabasePublicConfig();
  if (!config) return null;
  cached = createBrowserClient<Database>(config.url, config.key);
  return cached;
}
