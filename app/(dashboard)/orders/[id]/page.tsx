import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { OrderStatusControl } from "@/components/orders/OrderStatusControl";
import { IconPrinter } from "@/components/ui/icons";
import { getOrder } from "@/lib/orders/repository";
import { getStoreSettings } from "@/lib/settings/repository";
import { formatDateTime, formatMoney, shortenId } from "@/lib/format";
import { titleCase } from "@/components/ui/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const settings = await getStoreSettings();
  const currency = order.currency || settings.currency;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Order ${shortenId(order.id, 10)}`}
        description={
          <span className="inline-flex items-center gap-2">
            <Badge tone={order.status}>{titleCase(order.status)}</Badge>
            <span className="text-xs text-[var(--color-ink-muted)]">Placed {formatDateTime(order.createdAt)}</span>
          </span>
        }
        backHref="/orders"
        backLabel="Back to orders"
        action={
          <LinkButton href={`/print/orders/${order.id}`} target="_blank" variant="secondary" size="md">
            <IconPrinter width={16} height={16} />
            Invoice
          </LinkButton>
        }
      />

      <Card className="mb-5">
        <CardHeader title="Update status" description="Move the order through fulfilment." />
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader title="Customer" />
          <dl className="space-y-3 text-sm">
            <Row label="Name" value={order.customerName} />
            <Row label="Mobile" value={<a className="text-[var(--color-brand-soft)]" href={`tel:${order.customerMobile}`}>{order.customerMobile}</a>} />
            <Row label="Address" value={order.customerAddress} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Payment & delivery" />
          <dl className="space-y-3 text-sm">
            <Row label="Payment method" value={titleCase(order.paymentMethod)} />
            <Row label="Currency" value={currency} />
            <Row label="Last updated" value={formatDateTime(order.updatedAt)} />
          </dl>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Items" description={`${order.items.length} line item${order.items.length === 1 ? "" : "s"}.`} />
        {order.items.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)]">No line items recorded for this order.</p>
        ) : (
          <ul className="divide-y divide-white/6">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-[var(--color-ink)]">{item.productName}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {item.quantity} × {formatMoney(item.unitPriceBdt, currency)}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-[var(--color-ink)]">
                  {formatMoney(item.lineTotalBdt, currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-5">
        <CardHeader title="Summary" />
        <dl className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatMoney(order.subtotalBdt, currency)} />
          <Row label="Delivery charge" value={formatMoney(order.deliveryChargeBdt, currency)} />
          <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-3">
            <dt className="font-semibold text-[var(--color-ink)]">Total</dt>
            <dd className="text-lg font-bold tabular-nums text-[var(--color-ink)]">
              {formatMoney(order.totalBdt, currency)}
            </dd>
          </div>
        </dl>
      </Card>

      <p className="mt-4 break-all text-xs text-[var(--color-ink-muted)]">Order id: {order.id}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="max-w-[65%] text-right text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}
