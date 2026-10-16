import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookPageRow, BookRow, BookSummary, PageRecord } from "@/types/admin";
import type { BookCreateInput, BookUpdateInput } from "@/lib/validation/book";

export const BOOKS_TABLE = "books";
export const BOOK_PAGES_TABLE = "book_pages";

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = asNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mapBookRow(row: BookRow, pageCount?: number): BookSummary {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    coverImagePath: row.cover_image_path,
    contentMode: row.content_mode,
    pdfStoragePath: row.pdf_storage_path,
    isPublished: row.is_published,
    price: asNumber(row.price),
    offerPrice: asNullableNumber(row.offer_price),
    deliveryCharge: asNumber(row.delivery_charge),
    currency: row.currency,
    previewPageCount: asNumber(row.preview_page_count),
    defaultMode: row.default_mode,
    pageAspectRatio: asNumber(row.page_aspect_ratio, 1.4),
    flipEnabled: row.flip_enabled,
    pdfEnabled: row.pdf_enabled,
    minZoom: asNumber(row.min_zoom, 0.75),
    maxZoom: asNumber(row.max_zoom, 2.5),
    marketCountry: row.market_country,
    phoneRegion: row.phone_region,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(pageCount !== undefined ? { pageCount } : {}),
  };
}

export function mapPageRow(row: BookPageRow): PageRecord {
  return {
    id: row.id,
    bookId: row.book_id,
    storagePath: row.storage_path,
    pageNumber: row.page_number,
    isAvailable: row.is_available,
    alt: row.alt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** List all books with their page counts (dashboard is for a small catalog). */
export async function listBooks(): Promise<BookSummary[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];

  const counts = await pageCounts();
  return (data as BookRow[]).map((row) => mapBookRow(row, counts.get(row.id) ?? 0));
}

async function pageCounts(): Promise<Map<string, number>> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .select("book_id");
  const map = new Map<string, number>();
  if (error || !data) return map;
  for (const row of data as Pick<BookPageRow, "book_id">[]) {
    map.set(row.book_id, (map.get(row.book_id) ?? 0) + 1);
  }
  return map;
}

export async function getBook(id: string): Promise<BookSummary | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const { count } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("book_id", id);
  return mapBookRow(data as BookRow, count ?? 0);
}

export async function bookExists(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function createBook(input: BookCreateInput): Promise<BookSummary> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .insert({
      id: input.id,
      title: input.title,
      author: input.author,
      description: input.description,
      price: input.price,
      offer_price: input.offerPrice,
      delivery_charge: input.deliveryCharge,
      currency: input.currency,
      preview_page_count: input.previewPageCount,
      content_mode: input.contentMode,
      default_mode: input.defaultMode,
      page_aspect_ratio: input.pageAspectRatio,
      flip_enabled: input.flipEnabled,
      pdf_enabled: input.pdfEnabled,
      min_zoom: input.minZoom,
      max_zoom: input.maxZoom,
      market_country: input.marketCountry,
      phone_region: input.phoneRegion,
      is_published: input.isPublished,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create the book.");
  }
  return mapBookRow(data as BookRow, 0);
}

export async function updateBook(id: string, input: BookUpdateInput): Promise<BookSummary> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .update({
      title: input.title,
      author: input.author,
      description: input.description,
      price: input.price,
      offer_price: input.offerPrice,
      delivery_charge: input.deliveryCharge,
      currency: input.currency,
      preview_page_count: input.previewPageCount,
      content_mode: input.contentMode,
      default_mode: input.defaultMode,
      page_aspect_ratio: input.pageAspectRatio,
      flip_enabled: input.flipEnabled,
      pdf_enabled: input.pdfEnabled,
      min_zoom: input.minZoom,
      max_zoom: input.maxZoom,
      market_country: input.marketCountry,
      phone_region: input.phoneRegion,
      is_published: input.isPublished,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not update the book.");
  }
  const { count } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("book_id", id);
  return mapBookRow(data as BookRow, count ?? 0);
}

/** Toggle publication. Touches `updated_at` (trigger) to notify the website. */
export async function setPublished(id: string, isPublished: boolean): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Update one internal path/folder field (cover or PDF) and touch `updated_at`. */
export async function setBookAssetPath(
  id: string,
  field: "cover_image_path" | "pdf_storage_path",
  path: string | null,
): Promise<void> {
  const patch =
    field === "cover_image_path"
      ? { cover_image_path: path }
      : { pdf_storage_path: path };
  const { error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .update(patch)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Touch the book row so Realtime notifies the website (e.g. after a PDF replace). */
export async function touchBook(id: string): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(BOOKS_TABLE)
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getPages(bookId: string): Promise<PageRecord[]> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .select("*")
    .eq("book_id", bookId)
    .order("page_number", { ascending: true });
  if (error || !data) return [];
  return (data as BookPageRow[]).map(mapPageRow);
}

export async function getPage(bookId: string, pageId: string): Promise<PageRecord | null> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .select("*")
    .eq("book_id", bookId)
    .eq("id", pageId)
    .maybeSingle();
  if (error || !data) return null;
  return mapPageRow(data as BookPageRow);
}

export async function createPage(input: {
  bookId: string;
  storagePath: string;
  pageNumber: number;
  isAvailable?: boolean;
  alt?: string | null;
}): Promise<PageRecord> {
  const { data, error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .insert({
      book_id: input.bookId,
      storage_path: input.storagePath,
      page_number: input.pageNumber,
      is_available: input.isAvailable ?? true,
      alt: input.alt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create the page.");
  return mapPageRow(data as BookPageRow);
}

export async function updatePage(
  pageId: string,
  updates: { isAvailable?: boolean; alt?: string | null; storagePath?: string },
): Promise<void> {
  const patch: { is_available?: boolean; alt?: string | null; storage_path?: string } = {};
  if (updates.isAvailable !== undefined) patch.is_available = updates.isAvailable;
  if (updates.alt !== undefined) patch.alt = updates.alt;
  if (updates.storagePath !== undefined) patch.storage_path = updates.storagePath;
  if (Object.keys(patch).length === 0) return;
  const { error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .update(patch)
    .eq("id", pageId);
  if (error) throw new Error(error.message);
}

export async function deletePage(pageId: string): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from(BOOK_PAGES_TABLE)
    .delete()
    .eq("id", pageId);
  if (error) throw new Error(error.message);
}

const REORDER_OFFSET = 1_000_000;

/**
 * Reorder pages by updating `page_number`, respecting the unique
 * `(book_id, page_number)` constraint without an explicit transaction.
 *
 * Two-phase update: the ordered ids are first moved to a high temporary offset
 * (hidden from the public preview, which is bounded by `preview_page_count` and
 * sorted ascending), then assigned their final numbers. If the second phase is
 * interrupted, calling reorder again repairs the state. A future migration can
 * replace this with an atomic RPC (documented in docs/ROADMAP.md).
 */
export async function reorderPages(bookId: string, orderedIds: string[]): Promise<void> {
  const existing = await getPages(bookId);
  const existingIds = new Set(existing.map((page) => page.id));
  const ordered = orderedIds.filter((id) => existingIds.has(id));
  if (ordered.length !== existing.length) {
    throw new Error("Page order does not match the book's pages. Reload and try again.");
  }
  const supabase = getSupabaseAdminClient();

  // Phase 1: move to temporary distinct numbers.
  for (let index = 0; index < ordered.length; index += 1) {
    const { error } = await supabase
      .from(BOOK_PAGES_TABLE)
      .update({ page_number: REORDER_OFFSET + index })
      .eq("book_id", bookId)
      .eq("id", ordered[index]);
    if (error) throw new Error(`Reorder failed while preparing pages: ${error.message}`);
  }

  // Phase 2: assign final numbers.
  for (let index = 0; index < ordered.length; index += 1) {
    const { error } = await supabase
      .from(BOOK_PAGES_TABLE)
      .update({ page_number: index + 1 })
      .eq("book_id", bookId)
      .eq("id", ordered[index]);
    if (error) throw new Error(`Reorder failed while assigning final order: ${error.message}`);
  }

  await touchBook(bookId);
}
