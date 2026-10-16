import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/feedback";
import { IconShield, IconUser } from "@/components/ui/icons";
import { signOutAction } from "@/lib/auth/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { listAdminAccounts } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireAdmin();
  const admins = await listAdminAccounts();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Admin account" description="Your session and the administrator allow-list." />

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

        <Card className="p-0">
          <div className="p-5 pb-0">
            <CardHeader
              title="Administrators"
              description={`${admins.length} account${admins.length === 1 ? "" : "s"} in the allow-list.`}
            />
          </div>
          {admins.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-[var(--color-ink-muted)]">No administrators found.</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {admins.map((admin) => (
                <li key={admin.userId} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                      {admin.email ?? "Unknown email"}
                    </p>
                    <p className="break-all text-xs text-[var(--color-ink-muted)]">{admin.userId}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {admin.userId === session.userId ? <Badge tone="published">You</Badge> : null}
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      Added {formatDate(admin.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Grant or revoke access"
            description="Administrator membership is changed manually for safety."
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
              Copy their user id and insert a row into the <code>admin_users</code> table
              (<code>user_id</code>).
            </li>
            <li>They can now sign in here. Removing the row revokes access immediately.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
