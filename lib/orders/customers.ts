import "server-only";

import { listOrderAggregates } from "./repository";
import type { CustomerSummary, OrderStatus } from "@/types/admin";

export async function listCustomers(): Promise<CustomerSummary[]> {
  const rows = await listOrderAggregates();
  const byMobile = new Map<string, CustomerSummary>();

  for (const row of rows) {
    const key = row.customerMobile.trim();
    const current = byMobile.get(key) ?? {
      mobile: key,
      name: row.customerName,
      addresses: [],
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: row.createdAt,
      statuses: {} as Partial<Record<OrderStatus, number>>,
    };
    current.orderCount += 1;
    if (row.status !== "cancelled") current.totalSpent += row.totalBdt;
    current.statuses[row.status] = (current.statuses[row.status] ?? 0) + 1;
    if (!current.addresses.includes(row.customerAddress)) current.addresses.push(row.customerAddress);
    if (new Date(row.createdAt) > new Date(current.lastOrderAt)) {
      current.lastOrderAt = row.createdAt;
      current.name = row.customerName;
    }
    byMobile.set(key, current);
  }

  return Array.from(byMobile.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
