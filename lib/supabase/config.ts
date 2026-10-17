/**
 * Central reading + validation of Supabase environment configuration for the
 * Admin Dashboard. Mirrors the website's conventions so both apps connect to
 * the same project with the same variable names.
 *
 * Server-only privileged values must never be imported into browser code.
 */

export interface SupabasePublicConfig {
  url: string;
  /** Browser-safe key: publishable key, or the legacy anon key. */
  key: string;
}

/**
 * IMPORTANT: public values are read via STATIC property access
 * (`process.env.NEXT_PUBLIC_X`) so Next.js can inline them into the browser
 * bundle at build time. Dynamic access (`process.env[name]`) is NOT replaced by
 * Next and evaluates to `undefined` in client code — which previously made the
 * browser Supabase client initialise as null and surfaced as
 * "Storage client is unavailable (Supabase not configured)."
 */
const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Trim a raw env value; return null when unset/blank. */
function clean(value: string | undefined | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Server-only reads. These variables must never be exposed to the browser, so
 * they are read at runtime on the server (never inlined into client bundles).
 */
function readServerEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

/** Public project URL (safe for the browser). */
export function getSupabaseUrl(): string | null {
  return clean(PUBLIC_SUPABASE_URL);
}

/** Browser-safe key (publishable preferred, anon fallback). */
export function getSupabasePublicKey(): string | null {
  return clean(PUBLIC_SUPABASE_PUBLISHABLE_KEY) ?? clean(PUBLIC_SUPABASE_ANON_KEY);
}

/** Server-only privileged key (secret preferred, service_role fallback). */
export function getSupabaseSecretKey(): string | null {
  return readServerEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
}

/**
 * Storage bucket for product images.
 *
 * The env var name stays `SUPABASE_BOOK_BUCKET` for compatibility with the
 * existing `.env.local`, but its value points at the Nuri store bucket
 * (`nuri-product-images`). Falls back to `nuri-product-images`.
 */
export function getSupabaseProductBucket(): string {
  return readServerEnv("SUPABASE_BOOK_BUCKET") ?? "nuri-product-images";
}

/** True when public (browser) Supabase access is configured. */
export function isSupabasePublicConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

/** True when the privileged server key is configured. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) return null;
  return { url, key };
}

/** Names of missing public env vars (never values). Empty when configured. */
export function missingPublicConfigVars(): string[] {
  const missing: string[] = [];
  if (!getSupabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!getSupabasePublicKey()) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  return missing;
}

/**
 * Human-readable diagnostic that lists missing variable NAMES only (never
 * values). Safe to show in the UI and to log.
 */
export function publicConfigDiagnostic(): string {
  const missing = missingPublicConfigVars();
  if (missing.length === 0) return "Supabase browser client is configured.";
  return (
    `Supabase browser client is not configured. Missing: ${missing.join(", ")}. ` +
    "Set these in .env.local and restart/rebuild — Next.js inlines NEXT_PUBLIC_* at build time."
  );
}

/** Public project URL for display in the Settings screen (never the key). */
export function getSupabaseProjectRef(): string | null {
  const url = getSupabaseUrl();
  if (!url) return null;
  const match = url.match(/^https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match ? match[1] : null;
}

export const MISSING_SUPABASE_MESSAGE =
  "Supabase is not configured for the Admin Dashboard. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY), and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY). See .env.example.";
