import type { Tables } from "@/types/database";

export type ProductRow = Tables<"products">;
export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;
export type StoreSettingsRow = Tables<"store_settings">;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Allowed forward transitions for an order. Cancellation is permitted from any
 * non-terminal state. Terminal states (delivered, cancelled) cannot transition
 * further. This is enforced server-side so the API can also validate it.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/** Statuses counted as realized revenue. Cancelled orders are excluded. */
export const REVENUE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** A catalog product as shown/edited in the dashboard. */
export interface ProductSummary {
  id: string;
  name: string;
  description: string | null;
  priceBdt: number;
  imagePath: string | null;
  isAvailable: boolean;
  stockQuantity: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A single line item within an order. */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPriceBdt: number;
  lineTotalBdt: number;
  createdAt: string;
}

export interface OrderListItem {
  id: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  paymentMethod: string;
  status: OrderStatus;
  subtotalBdt: number;
  deliveryChargeBdt: number;
  totalBdt: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface OrderDetail extends OrderListItem {
  items: OrderItem[];
}

export interface CustomerSummary {
  mobile: string;
  name: string;
  addresses: string[];
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  statuses: Partial<Record<OrderStatus, number>>;
}

export interface StoreSettings {
  deliveryChargeBdt: number;
  currency: string;
}

export interface OverviewStats {
  totalProducts: number;
  availableProducts: number;
  unavailableProducts: number;
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenue: number;
  currency: string;
  recentOrders: OrderListItem[];
  recentlyUpdatedProducts: ProductSummary[];
}
