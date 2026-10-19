import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ORDER_STATUSES,
  type OrderListItem,
  type OrderRow,
  type OrderStatus,
} from "@/types/admin";
import type { OrderQuery } from "@/lib/validation/order";

export const ORDERS_TABLE = "orders";

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function mapOrderRow(row: OrderRow): OrderListItem {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.book_title,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    bookPrice: asNumber(row.book_price),
    deliveryCharge: asNumber(row.delivery_charge),
    totalAmount: asNumber(row.total_amount),
    currency: row.currency,
    paymentMethod: row.payment_method,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Strip PostgREST filter control characters from a free-text search term. */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()*]/g, " ").trim();
}

export interface OrderListResult {
  rows: OrderListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listOrders(query: OrderQuery): Promise<OrderListResult> {
  const supabase = getSupabaseAdminClient();
  let builder = supabase.from(ORDERS_TABLE).select("*", { count: "exact" });

  const term = sanitizeSearch(query.q);
  if (term) {
    const like = `%${term}%`;
    const parts = [
      `customer_name.ilike.${like}`,
      `customer_phone.ilike.${like}`,
      `customer_address.ilike.${like}`,
      `book_title.ilike.${like}`,
    ];
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)) {
      parts.unshift(`id.eq.${term}`);
    }
    builder = builder.or(parts.join(","));
  }

  if (query.status) builder = builder.eq("status", query.status);
  if (query.from) builder = builder.gte("created_at", `${query.from}T00:00:00.000Z`);
  if (query.to) builder = builder.lte("created_at", `${query.to}T23:59:59.999Z`);

  builder = builder.order(query.sort, { ascending: query.dir === "asc" });

  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;
  builder = builder.range(from, to);

  const { data, error, count } = await builder;
  if (error || !data) {
    return { rows: [], total: 0, page: query.page, perPage: query.perPage, pageCount: 0 };
  }
  const total = count ?? data.length;
  return {
    rows: (data as OrderRow[]).map(mapOrderRow),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getOrder(id: string): Promise<OrderListItem | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from(ORDERS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapOrderRow(data as OrderRow);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(ORDERS_TABLE)
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export interface OrderAggregateRow {
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

/** Fetch the minimal columns needed for stats and customer aggregation. */
export async function listOrderAggregates(): Promise<OrderAggregateRow[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(ORDERS_TABLE)
    .select("status, total_amount, created_at, customer_name, customer_phone, customer_address")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Pick<
    OrderRow,
    "status" | "total_amount" | "created_at" | "customer_name" | "customer_phone" | "customer_address"
  >[]).map((row) => ({
    status: (ORDER_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as OrderStatus)
      : "pending",
    totalAmount: asNumber(row.total_amount),
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
  }));
}

export interface OrderStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  revenue: number;
  currency: string;
}

/** Real counts + revenue (all non-cancelled orders), tallied from the DB. */
export async function getOrderStats(): Promise<OrderStats> {
  const rows = await listOrderAggregates();
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
    OrderStatus,
    number
  >;
  let revenue = 0;
  const currency = "BDT";
  for (const row of rows) {
    byStatus[row.status] += 1;
    if (row.status !== "cancelled") revenue += row.totalAmount;
  }
  return { total: rows.length, byStatus, revenue, currency };
}
