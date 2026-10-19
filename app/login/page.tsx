import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { countAdmins } from "@/lib/auth/session";
import { isSupabaseAdminConfigured, isSupabasePublicConfigured } from "@/lib/supabase/config";
import { Alert } from "@/components/ui/feedback";
import { IconBook, IconShield } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = { title: "Sign in — HSC English Last Hour Admin" };

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = isSupabasePublicConfigured() && isSupabaseAdminConfigured();
  const adminCount = configured ? await countAdmins() : 0;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{ backgroundImage: "var(--grad-primary)", boxShadow: "var(--shadow-primary)" }}
              aria-hidden="true"
            >
              <IconBook width={20} height={20} />
            </span>
            <div>
              <p className="brand-text text-lg font-bold">HSC English Last Hour</p>
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

          {configured && adminCount === 0 ? (
            <Alert tone="info" className="mb-4">
              <strong>First-run setup:</strong> no administrator account exists yet. Create a user in
              Supabase Auth (Authentication → Users), then add that user&apos;s ID to the{" "}
              <code>admin_users</code> table. Sign in afterwards. See{" "}
              <code>docs/SECURITY.md</code>.
            </Alert>
          ) : null}

          <LoginForm />

          <p className="mt-5 text-center text-xs text-[var(--color-ink-muted)]">
            Access is restricted to members of the <code>admin_users</code> allow-list. New
            accounts cannot self-register as administrators.
          </p>
        </div>
      </div>
    </main>
  );
}
