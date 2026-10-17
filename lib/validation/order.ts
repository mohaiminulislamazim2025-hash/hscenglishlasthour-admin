import { z } from "zod";
import { ORDER_STATUSES } from "@/types/admin";

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order id."),
  status: orderStatusSchema,
});

/** Order list filters parsed from URL search params. */
export const orderQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  status: z
    .union([orderStatusSchema, z.literal(""), z.literal("all")])
    .optional()
    .transform((value) => (value === "" || value === "all" ? undefined : value)),
  from: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid from date.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  to: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid to date.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  sort: z
    .enum(["created_at", "total_bdt", "status", "customer_name"])
    .optional()
    .default("created_at"),
  dir: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(5).max(100).optional().default(20),
});

export type OrderQuery = z.infer<typeof orderQuerySchema>;

export function parseOrderQuery(params: Record<string, string | string[] | undefined>): OrderQuery {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) flat[key] = value[0] ?? "";
    else if (typeof value === "string") flat[key] = value;
  }
  return orderQuerySchema.parse(flat);
}
