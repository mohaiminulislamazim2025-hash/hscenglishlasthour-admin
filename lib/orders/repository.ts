import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  ORDER_STATUSES,
  type OrderDetail,
  type OrderItem,
  type OrderListItem,
  type OrderStatus,
} from "@/types/admin";
import type { OrderQuery } from "@/lib/validation/order";

export const ORDERS_TABLE = "orders";
export const ORDER_ITEMS_TABLE = "order_items";

type Numericish = number | string | null | undefined;

/** Loose shape of an `orders` row, including legacy column aliases we read defensively. */
interface OrderDbRow {
  id: string;
  customer_name: string;
  customer_mobile?: string | null;
  customer_phone?: string | null;
  customer_address: string;
  payment_method: string;
  status: string;
  subtotal_bdt?: Numericish;
  subtotal?: Numericish;
  book_price?: Numericish;
  delivery_charge_bdt?: Numericish;
  delivery_charge?: Numericish;
  total_bdt?: Numericish;
  total_amount?: Numericish;
  currency?: string | null;
  created_at: string;
  updated_at: string;
}

/** Loose shape of an `order_items` row. */
interface OrderItemDbRow {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  quantity?: Numericish;
  unit_price_bdt?: Numericish;
  unit_price?: Numericish;
  line_total_bdt?: Numericish;
  line_total?: Numericish;
  created_at: string;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function mapOrderRow(row: OrderDbRow): OrderListItem {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerMobile: row.customer_mobile ?? row.customer_phone ?? "",
    customerAddress: row.customer_address,
    paymentMethod: row.payment_method,
    status: (ORDER_STATUSES as readonly string[]).includes(row.status) ? (row.status as OrderStatus) : "pending",
    subtotalBdt: asNumber(row.subtotal_bdt ?? row.subtotal ?? row.book_price),
    deliveryChargeBdt: asNumber(row.delivery_charge_bdt ?? row.delivery_charge),
    totalBdt: asNumber(row.total_bdt ?? row.total_amount),
    currency: row.currency ?? "BDT",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount: 0,
  };
}

function mapOrderItem(row: OrderItemDbRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id ?? null,
    productName: row.product_name,
    quantity: asNumber(row.quantity),
    unitPriceBdt: asNumber(row.unit_price_bdt ?? row.unit_price),
    lineTotalBdt: asNumber(row.line_total_bdt ?? row.line_total),
    createdAt: row.created_at,
  };
}

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
      `customer_mobile.ilike.${like}`,
      `customer_address.ilike.${like}`,
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
    rows: data.map(mapOrderRow),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(ORDER_ITEMS_TABLE)
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapOrderItem);
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from(ORDERS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const items = await getOrderItems(id);
  const order = mapOrderRow(data);
  return { ...order, itemCount: items.length, items };
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
  totalBdt: number;
  createdAt: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
}

interface OrderAggregateDbRow {
  status: string;
  total_bdt: number;
  created_at: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
}

export async function listOrderAggregates(): Promise<OrderAggregateRow[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(ORDERS_TABLE)
    .select("status, total_bdt, created_at, customer_name, customer_mobile, customer_address")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row: OrderAggregateDbRow) => ({
    status: (ORDER_STATUSES as readonly string[]).includes(row.status) ? (row.status as OrderStatus) : "pending",
    totalBdt: asNumber(row.total_bdt),
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerMobile: row.customer_mobile ?? "",
    customerAddress: row.customer_address,
  }));
}

export interface OrderStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  revenue: number;
  currency: string;
}

export async function getOrderStats(): Promise<OrderStats> {
  const rows = await listOrderAggregates();
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  let revenue = 0;
  const currency = "BDT";
  for (const row of rows) {
    byStatus[row.status] += 1;
    if (row.status !== "cancelled") revenue += row.totalBdt;
  }
  return { total: rows.length, byStatus, revenue, currency };
}
