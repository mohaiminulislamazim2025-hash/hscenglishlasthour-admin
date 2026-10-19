import "server-only";

import { listOrderAggregates } from "./repository";
import type { CustomerSummary, OrderStatus } from "@/types/admin";

/**
 * Customers are derived from orders. The existing website only collects name,
 * phone and address at checkout; there is no `customers` table. This aggregates
 * orders by normalized phone number, which is the natural customer key.
 */
export async function listCustomers(): Promise<CustomerSummary[]> {
  const rows = await listOrderAggregates();
  const byPhone = new Map<string, CustomerSummary>();

  for (const row of rows) {
    const key = row.customerPhone.trim();
    const current = byPhone.get(key) ?? {
      phone: key,
      name: row.customerName,
      addresses: [],
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: row.createdAt,
      statuses: {} as Partial<Record<OrderStatus, number>>,
    };
    current.orderCount += 1;
    if (row.status !== "cancelled") current.totalSpent += row.totalAmount;
    current.statuses[row.status] = (current.statuses[row.status] ?? 0) + 1;
    if (!current.addresses.includes(row.customerAddress)) current.addresses.push(row.customerAddress);
    if (new Date(row.createdAt) > new Date(current.lastOrderAt)) {
      current.lastOrderAt = row.createdAt;
      current.name = row.customerName;
    }
    byPhone.set(key, current);
  }

  return Array.from(byPhone.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
