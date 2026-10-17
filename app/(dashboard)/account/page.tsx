import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/feedback";
import { IconShield, IconUser } from "@/components/ui/icons";
import { signOutAction } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { describeAdminConfig } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAdmin();
  const adminConfig = describeAdminConfig();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Admin account" description="Your session and how admin access is granted." />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Signed in as" />
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 text-[var(--color-brand-soft)]">
              <IconUser width={20} height={20} />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-[var(--color-ink)]">{session.email ?? "Unknown email"}</p>
              <p className="break-all text-xs text-[var(--color-ink-muted)]">User id: {session.userId}</p>
            </div>
          </div>
          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-xl border border-white/8 px-4 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-white/8"
            >
              Sign out
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Administrator access"
            description="Authorization is a trusted claim, not a database table."
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[var(--color-brand-soft)]">
                <IconShield width={18} height={18} />
              </span>
            }
          />
          <Alert tone="warning" className="mb-4">
            This dashboard never creates or removes administrators on its own. Changes require
            explicit approval by the project owner.
          </Alert>
          <ol className="list-inside list-decimal space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Create the person&apos;s account in Supabase → Authentication → Users.</li>
            <li>
              Set that user&apos;s <code>app_metadata.role</code> to <code>admin</code> (via the
              dashboard or Admin API), or add their email to the server-only{" "}
              <code>ADMIN_EMAILS</code> environment variable.
            </li>
            <li>They can then sign in here. Removing the role/email revokes access immediately.</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--color-ink-muted)]">
            Admin email allow-list: {adminConfig.hasAllowList ? `${adminConfig.allowListCount} entr${adminConfig.allowListCount === 1 ? "y" : "ies"} configured.` : "not configured (relying on app_metadata.role)."}
          </p>
        </Card>
      </div>
    </div>
  );
}
