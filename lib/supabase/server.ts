import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig, MISSING_SUPABASE_MESSAGE } from "./config";

/**
 * Cookie-bound server Supabase client that respects the signed-in user's
 * session. Used for authentication (sign-in/sign-out, getUser) and for
 * RLS-scoped reads. Privileged data operations use `getSupabaseAdminClient()`.
 *
 * Returns null when the public environment variables are missing.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render: cookies are read-only.
          // Session refresh is handled in proxy.ts.
        }
      },
    },
  });
}

/** Throwing variant for code paths that cannot continue without Supabase. */
export async function requireSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error(MISSING_SUPABASE_MESSAGE);
  return client;
}
