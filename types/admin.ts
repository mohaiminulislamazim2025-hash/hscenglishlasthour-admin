import type { Tables } from "@/types/database";

export type BookRow = Tables<"books">;
export type BookPageRow = Tables<"book_pages">;
export type OrderRow = Tables<"orders">;

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

export const CONTENT_MODES = ["page-images", "pdf"] as const;
export type ContentMode = (typeof CONTENT_MODES)[number];

export const READING_MODES = ["flip", "pdf"] as const;
export type ReadingMode = (typeof READING_MODES)[number];

export interface BookSummary {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  coverImagePath: string | null;
  contentMode: string;
  pdfStoragePath: string | null;
  isPublished: boolean;
  price: number;
  offerPrice: number | null;
  deliveryCharge: number;
  currency: string;
  previewPageCount: number;
  defaultMode: string;
  pageAspectRatio: number;
  flipEnabled: boolean;
  pdfEnabled: boolean;
  minZoom: number;
  maxZoom: number;
  marketCountry: string;
  phoneRegion: string;
  createdAt: string;
  updatedAt: string;
  pageCount?: number;
}

export interface PageRecord {
  id: string;
  bookId: string;
  storagePath: string;
  pageNumber: number;
  isAvailable: boolean;
  alt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListItem {
  id: string;
  bookId: string;
  bookTitle: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  bookPrice: number;
  deliveryCharge: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  phone: string;
  name: string;
  addresses: string[];
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  statuses: Partial<Record<OrderStatus, number>>;
}

export interface OverviewStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenue: number;
  currency: string;
  recentOrders: OrderListItem[];
  recentlyUpdatedBooks: BookSummary[];
}
