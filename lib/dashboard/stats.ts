import "server-only";

import { listBooks } from "@/lib/books/repository";
import { getOrderStats, listOrders } from "@/lib/orders/repository";
import { orderQuerySchema } from "@/lib/validation/order";
import type { OverviewStats } from "@/types/admin";

/** Build the Overview screen's real statistics from the database. */
export async function getOverviewStats(): Promise<OverviewStats> {
  const [books, orderStats, recent] = await Promise.all([
    listBooks(),
    getOrderStats(),
    listOrders(orderQuerySchema.parse({ sort: "created_at", dir: "desc", page: 1, perPage: 6 })),
  ]);

  const publishedBooks = books.filter((book) => book.isPublished).length;
  const recentlyUpdatedBooks = books.slice(0, 5);

  return {
    totalBooks: books.length,
    publishedBooks,
    draftBooks: books.length - publishedBooks,
    totalOrders: orderStats.total,
    ordersByStatus: orderStats.byStatus,
    revenue: orderStats.revenue,
    currency: orderStats.currency,
    recentOrders: recent.rows,
    recentlyUpdatedBooks,
  };
}
