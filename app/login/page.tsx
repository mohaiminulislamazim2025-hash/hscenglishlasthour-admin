import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { describeAdminConfig } from "@/lib/auth/session";
import { isSupabaseAdminConfigured, isSupabasePublicConfigured } from "@/lib/supabase/config";
import { Alert } from "@/components/ui/feedback";
import { IconShield } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = { title: "Sign in — Nuri Shirt Store Admin" };

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = isSupabasePublicConfigured() && isSupabaseAdminConfigured();
  const adminConfig = describeAdminConfig();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/8"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logonuri.jpg" alt="" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="brand-text text-lg font-bold">Nuri Shirt Store</p>
              <p className="text-xs text-[var(--color-ink-muted)]">Admin dashboard</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="card glass p-6">
          <div className="mb-5 flex items-center gap-2">
            <IconShield width={18} height={18} className="text-[var(--color-brand-soft)]" />
            <h1 className="text-sm font-semibold text-[var(--color-ink)]">Administrator sign in</h1>
          </div>

          {!configured ? (
            <Alert tone="warning" className="mb-4">
              Supabase is not fully configured. Copy <code>.env.example</code> to{" "}
              <code>.env.local</code> and provide the project URL, publishable key and server
              secret key.
            </Alert>
          ) : null}

          {configured && !adminConfig.hasAllowList ? (
            <Alert tone="info" className="mb-4">
              <strong>Admin access:</strong> grant a user admin by setting{" "}
              <code>app_metadata.role = &quot;admin&quot;</code> in Supabase Auth, or list their email
              in <code>ADMIN_EMAILS</code>.
            </Alert>
          ) : null}

          <LoginForm />

          <p className="mt-5 text-center text-xs text-[var(--color-ink-muted)]">
            Access is restricted to authorized administrators. New accounts cannot self-register as
            administrators.
          </p>
        </div>
      </div>
    </main>
  );
}
