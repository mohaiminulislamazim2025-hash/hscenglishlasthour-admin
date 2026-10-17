import "server-only";

import { listProducts } from "@/lib/products/repository";
import { getOrderStats, listOrders } from "@/lib/orders/repository";
import { orderQuerySchema } from "@/lib/validation/order";
import type { OverviewStats } from "@/types/admin";

export async function getOverviewStats(): Promise<OverviewStats> {
  const [products, orderStats, recent] = await Promise.all([
    listProducts(),
    getOrderStats(),
    listOrders(orderQuerySchema.parse({ sort: "created_at", dir: "desc", page: 1, perPage: 6 })),
  ]);

  const availableProducts = products.filter((p) => p.isAvailable).length;
  const recentlyUpdatedProducts = products.slice(0, 5);

  return {
    totalProducts: products.length,
    availableProducts,
    unavailableProducts: products.length - availableProducts,
    totalOrders: orderStats.total,
    ordersByStatus: orderStats.byStatus,
    revenue: orderStats.revenue,
    currency: orderStats.currency,
    recentOrders: recent.rows,
    recentlyUpdatedProducts,
  };
}
