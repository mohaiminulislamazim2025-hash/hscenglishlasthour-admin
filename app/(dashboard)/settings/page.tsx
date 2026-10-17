import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/feedback";
import { IconExternal, IconShield } from "@/components/ui/icons";
import { StoreSettingsForm } from "@/components/settings/StoreSettingsForm";
import {
  getSupabaseProductBucket,
  getSupabaseProjectRef,
  isSupabaseAdminConfigured,
  isSupabasePublicConfigured,
} from "@/lib/supabase/config";
import { getOverviewStats } from "@/lib/dashboard/stats";
import { getStoreSettings } from "@/lib/settings/repository";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const projectRef = getSupabaseProjectRef();
  const bucket = getSupabaseProductBucket();
  const publicOk = isSupabasePublicConfigured();
  const adminOk = isSupabaseAdminConfigured();
  const stats = await getOverviewStats();
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Store configuration and integration information." />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Store settings" description="Delivery charge applied at checkout." />
          <dl className="space-y-3 text-sm">
            <Row label="Delivery charge" value={`৳${settings.deliveryChargeBdt}`} />
            <Row label="Currency" value={<code>{settings.currency}</code>} />
          </dl>
          <StoreSettingsForm deliveryCharge={settings.deliveryChargeBdt} />
        </Card>

        <Card>
          <CardHeader title="Supabase connection" description="Shared with the public storefront." />
          <dl className="space-y-3 text-sm">
            <Row label="Project ref" value={projectRef ?? "Not configured"} />
            <Row
              label="Public access"
              value={publicOk ? <Badge tone="published">Configured</Badge> : <Badge tone="cancelled">Missing</Badge>}
            />
            <Row
              label="Server secret key"
              value={adminOk ? <Badge tone="published">Configured</Badge> : <Badge tone="cancelled">Missing</Badge>}
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
            <Row label="Products" value={`${stats.totalProducts} (${stats.availableProducts} available)`} />
            <Row label="Orders" value={String(stats.totalOrders)} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Storage & uploads" />
          <p className="text-sm text-[var(--color-ink-muted)]">
            Product images are uploaded directly from the browser to Storage using short-lived signed
            upload URLs. The server secret key never reaches the browser. Limits enforced by this
            dashboard:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-[var(--color-ink-soft)]">
            <li>Images: up to 5 MB, webp/jpeg/png/avif</li>
            <li>
              Path convention mirrors the storefront (<code>products/{`{id}`}/image.ext</code>)
            </li>
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Storefront integration"
            description="How changes reach the public site."
            action={
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-[var(--color-brand-soft)]">
                <IconShield width={18} height={18} />
              </span>
            }
          />
          <ul className="space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Products and prices are served to the storefront from the shared Supabase project.</li>
            <li>Order status changes are visible to staff through this dashboard.</li>
          </ul>
          <Alert tone="info" className="mt-4">
            Editing here affects the live storefront immediately after the next refresh.
          </Alert>
        </Card>

        <Card>
          <CardHeader title="Security posture" />
          <ul className="space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Sign-in requires Supabase Auth plus a trusted admin claim.</li>
            <li>
              Admins are identified by <code>app_metadata.role = &quot;admin&quot;</code>, with an optional{" "}
              <code>ADMIN_EMAILS</code> allow-list.
            </li>
            <li>Public sign-up is disabled; new administrators are added manually.</li>
            <li>All privileged reads/writes use a server-only secret-key client after an admin check.</li>
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
