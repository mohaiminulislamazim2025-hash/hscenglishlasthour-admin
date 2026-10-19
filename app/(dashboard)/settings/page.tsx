import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/feedback";
import { IconExternal, IconShield } from "@/components/ui/icons";
import {
  getSupabaseBookBucket,
  getSupabaseProjectRef,
  isSupabaseAdminConfigured,
  isSupabasePublicConfigured,
} from "@/lib/supabase/config";
import { getOverviewStats } from "@/lib/dashboard/stats";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const projectRef = getSupabaseProjectRef();
  const bucket = getSupabaseBookBucket();
  const publicOk = isSupabasePublicConfigured();
  const adminOk = isSupabaseAdminConfigured();
  const stats = await getOverviewStats();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Read-only environment and integration information." />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Supabase connection" description="Shared with the public website." />
          <dl className="space-y-3 text-sm">
            <Row label="Project ref" value={projectRef ?? "Not configured"} />
            <Row
              label="Public access"
              value={
                publicOk ? (
                  <Badge tone="published">Configured</Badge>
                ) : (
                  <Badge tone="cancelled">Missing</Badge>
                )
              }
            />
            <Row
              label="Server secret key"
              value={
                adminOk ? (
                  <Badge tone="published">Configured</Badge>
                ) : (
                  <Badge tone="cancelled">Missing</Badge>
                )
              }
            />
            <Row label="Storage bucket" value={<code>{bucket}</code>} />
          </dl>
          {projectRef ? (
            <a
              href={`https://supabase.com/dashboard/project/${projectRef}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-soft)] hover:underline"
            >
              Open Supabase project <IconExternal width={13} height={13} />
            </a>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="Catalog snapshot" description="Live counts read from the database." />
          <dl className="space-y-3 text-sm">
            <Row label="Books" value={`${stats.totalBooks} (${stats.publishedBooks} published)`} />
            <Row label="Orders" value={String(stats.totalOrders)} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Storage & uploads" />
          <p className="text-sm text-[var(--color-ink-muted)]">
            Large files are uploaded directly from the browser to private Storage using short-lived
            signed upload URLs. The server secret key never reaches the browser, and the{" "}
            <code>{bucket}</code> bucket stays private. Limits enforced by this dashboard:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--color-ink-soft)]">
            <li>PDF: up to 50 MB, <code>application/pdf</code> only</li>
            <li>Images (cover/pages): up to 15 MB, webp/jpeg/png</li>
            <li>Path convention mirrors the website (<code>books/{`{id}`}/…</code>)</li>
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Website integration"
            description="How changes reach the public site."
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[var(--color-brand-soft)]">
                <IconShield width={18} height={18} />
              </span>
            }
          />
          <ul className="space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Catalog and page changes are picked up automatically (Realtime + polling + focus refresh).</li>
            <li>Replacing a PDF clears the website&apos;s cached preview so it is regenerated from the new file.</li>
            <li>Unpublished books are hidden from visitors.</li>
          </ul>
          <Alert tone="info" className="mt-4">
            Publishing/editing here affects the live website immediately after the next refresh.
          </Alert>
        </Card>

        <Card>
          <CardHeader title="Security posture" />
          <ul className="space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Sign-in is restricted to members of the <code>admin_users</code> allow-list.</li>
            <li>Public sign-up is disabled; new administrators must be added manually.</li>
            <li>All privileged reads/writes use a server-only service-role client after an admin check.</li>
            <li>The <code>{bucket}</code> bucket is private; the full PDF is never served publicly.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="text-right text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
