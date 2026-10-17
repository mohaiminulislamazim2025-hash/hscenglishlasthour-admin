import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/form";
import { IconOrders, IconSearch } from "@/components/ui/icons";
import { listOrders } from "@/lib/orders/repository";
import { parseOrderQuery } from "@/lib/validation/order";
import { formatDateTime, formatMoney } from "@/lib/format";
import { titleCase } from "@/components/ui/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/admin";

export const dynamic = "force-dynamic";

function buildHref(
  base: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/orders?${qs}` : "/orders";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = parseOrderQuery(raw);
  const result = await listOrders(query);

  const base = {
    q: query.q || undefined,
    status: query.status,
    from: query.from,
    to: query.to,
    sort: query.sort,
    dir: query.dir,
    perPage: String(query.perPage),
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${result.total} order${result.total === 1 ? "" : "s"} · ${query.perPage} per page`}
      />

      <Card className="mb-5">
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <Field label="Search" htmlFor="q" className="lg:col-span-2">
            <Input
              id="q"
              name="q"
              defaultValue={query.q}
              placeholder="Name, mobile, address or order id"
            />
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={query.status ?? ""}>
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From" htmlFor="from">
            <Input id="from" name="from" type="date" defaultValue={query.from ?? ""} />
          </Field>
          <Field label="To" htmlFor="to">
            <Input id="to" name="to" type="date" defaultValue={query.to ?? ""} />
          </Field>
          <input type="hidden" name="sort" value={query.sort} />
          <input type="hidden" name="dir" value={query.dir} />
          <div className="flex gap-2 lg:col-span-5">
            <Button type="submit" size="md">
              <IconSearch width={15} height={15} />
              Apply filters
            </Button>
            <Link
              href="/orders"
              className="inline-flex h-10 items-center rounded-xl px-4 text-sm text-[var(--color-ink-muted)] hover:bg-white/5"
            >
              Reset
            </Link>
          </div>
        </form>
      </Card>

      {result.rows.length === 0 ? (
        <EmptyState
          title="No orders match"
          description="Try clearing filters or broadening the date range."
          icon={<IconOrders />}
        />
      ) : (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-xs text-[var(--color-ink-muted)]">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Items</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Placed</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {result.rows.map((order) => (
                    <tr key={order.id} className="transition hover:bg-white/4">
                      <td className="px-5 py-3">
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className="font-medium text-[var(--color-ink)]">{order.customerName}</span>
                          <span className="block text-xs text-[var(--color-ink-muted)]">
                            {order.customerMobile}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-[var(--color-ink-soft)]">
                        <span className="line-clamp-1">
                          {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums font-medium text-[var(--color-ink)]">
                        {formatMoney(order.totalBdt, order.currency)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={order.status}>{titleCase(order.status)}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-[var(--color-ink-muted)]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-xs font-medium text-[var(--color-brand-soft)] hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {result.pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-xs text-[var(--color-ink-muted)]">
                Page {result.page} of {result.pageCount}
              </span>
              <div className="flex gap-2">
                {result.page > 1 ? (
                  <Link
                    href={buildHref(base, { page: String(result.page - 1) })}
                    className="inline-flex h-9 items-center rounded-lg border border-white/8 px-3 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-white/8"
                  >
                    Previous
                  </Link>
                ) : null}
                {result.page < result.pageCount ? (
                  <Link
                    href={buildHref(base, { page: String(result.page + 1) })}
                    className="inline-flex h-9 items-center rounded-lg border border-white/8 px-3 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-white/8"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
