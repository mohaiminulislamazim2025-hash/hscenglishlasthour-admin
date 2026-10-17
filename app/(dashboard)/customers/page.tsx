import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/feedback";
import { IconOrders, IconUsers } from "@/components/ui/icons";
import { listCustomers } from "@/lib/orders/customers";
import { formatDate, formatMoney } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Derived from orders, grouped by mobile number. The website collects name, mobile and address only."
      />

      {customers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customers appear here once orders are placed on the website."
          icon={<IconUsers />}
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs text-[var(--color-ink-muted)]">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-3 py-3 font-medium">Orders</th>
                  <th className="px-3 py-3 font-medium">Total spent</th>
                  <th className="px-3 py-3 font-medium">Statuses</th>
                  <th className="px-5 py-3 font-medium">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {customers.map((customer) => (
                  <tr key={customer.mobile} className="align-top transition hover:bg-white/4">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--color-ink)]">{customer.name}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">{customer.mobile}</p>
                      {customer.addresses.length > 0 ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[var(--color-ink-muted)]">
                          {customer.addresses[0]}
                          {customer.addresses.length > 1 ? ` +${customer.addresses.length - 1} more` : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <Link
                        href={`/orders?q=${encodeURIComponent(customer.mobile)}`}
                        className="text-[var(--color-brand-soft)] hover:underline"
                      >
                        {customer.orderCount}
                      </Link>
                    </td>
                    <td className="px-3 py-3 tabular-nums font-medium text-[var(--color-ink)]">
                      {formatMoney(customer.totalSpent)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ORDER_STATUSES.map((status) => {
                          const count = customer.statuses[status] ?? 0;
                          if (!count) return null;
                          return (
                            <Badge key={status} tone={status}>
                              {ORDER_STATUS_LABELS[status]} {count}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--color-ink-muted)]">
                      {formatDate(customer.lastOrderAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
        <IconOrders width={14} height={14} />
        Totals exclude cancelled orders.
      </p>
    </div>
  );
}
