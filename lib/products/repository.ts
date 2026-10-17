import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProductRow, ProductSummary } from "@/types/admin";
import type { ProductCreateInput, ProductUpdateInput } from "@/lib/validation/product";

export const PRODUCTS_TABLE = "products";

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

export function mapProductRow(row: ProductRow): ProductSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceBdt: asNumber(row.price_bdt),
    imagePath: asNullableString(row.image_path),
    isAvailable: Boolean(row.is_available),
    stockQuantity: asNumber(row.stock_quantity),
    sortOrder: asNumber(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProducts(): Promise<ProductSummary[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ProductRow[]).map(mapProductRow);
}

export async function getProduct(id: string): Promise<ProductSummary | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapProductRow(data as ProductRow);
}

export async function productExists(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function createProduct(input: ProductCreateInput): Promise<ProductSummary> {
  const { data, error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .insert({
      name: input.name,
      description: input.description,
      price_bdt: input.priceBdt,
      stock_quantity: input.stockQuantity,
      is_available: input.isAvailable,
      sort_order: input.sortOrder,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create the product.");
  }
  return mapProductRow(data as ProductRow);
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductSummary> {
  const { data, error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .update({
      name: input.name,
      description: input.description,
      price_bdt: input.priceBdt,
      stock_quantity: input.stockQuantity,
      is_available: input.isAvailable,
      sort_order: input.sortOrder,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not update the product.");
  }
  return mapProductRow(data as ProductRow);
}

export async function setAvailability(id: string, isAvailable: boolean): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setProductImagePath(id: string, path: string | null): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .update({ image_path: path })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function touchProduct(id: string): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(PRODUCTS_TABLE)
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
