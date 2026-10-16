"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, AuthorizationError } from "@/lib/auth/dal";
import {
  bookExists,
  createBook,
  createPage,
  deletePage,
  getBook,
  getPage,
  getPages,
  reorderPages,
  setBookAssetPath,
  setPublished,
  touchBook,
  updateBook,
  updatePage,
} from "@/lib/books/repository";
import {
  bookCreateFinalSchema,
  bookUpdateFinalSchema,
} from "@/lib/validation/book";
import { invalidatePreviewCache, objectExists, removeObjects } from "@/lib/supabase/storage";
import { buildCoverPath, buildPdfPath, buildPreviewPdfPath } from "@/lib/storage/paths";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export interface BookFormState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function zodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") obj[key] = value;
  }
  return obj;
}

export async function createBookAction(
  _prev: BookFormState | undefined,
  formData: FormData,
): Promise<BookFormState> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }

  const parsed = bookCreateFinalSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (await bookExists(parsed.data.id)) {
    return { ok: false, message: "A book with this id already exists.", fieldErrors: { id: "This id is already in use." } };
  }

  try {
    await createBook(parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create the book." };
  }

  revalidatePath("/books");
  revalidatePath("/");
  redirect(`/books/${parsed.data.id}/content`);
}

export async function updateBookAction(
  _prev: BookFormState | undefined,
  formData: FormData,
): Promise<BookFormState> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id || !(await bookExists(id))) {
    return { ok: false, message: "Book not found." };
  }

  const parsed = bookUpdateFinalSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await updateBook(id, parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update the book." };
  }

  revalidatePath(`/books/${id}`);
  revalidatePath("/books");
  revalidatePath("/");
  return { ok: true, message: "Book saved." };
}

async function guard(): Promise<void> {
  await requireAdminAction();
}

export async function setPublishedAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!id) return;
  await setPublished(id, published);
  revalidatePath(`/books/${id}`);
  revalidatePath("/books");
  revalidatePath("/");
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const book = await getBook(id);
  if (!book) return;

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await getSupabaseAdminClient().from("books").delete().eq("id", id);
  if (error) {
    // 23503 = foreign_key_violation (orders reference this book: on delete restrict)
    if ((error as { code?: string }).code === "23503") {
      redirect(`/books/${id}?error=orders`);
    }
    redirect(`/books/${id}?error=delete`);
  }

  // Best-effort asset cleanup after the DB row is gone.
  const pages = await getPages(id).catch(() => []);
  await removeObjects([
    buildCoverPath(id, "webp"),
    buildPdfPath(id),
    buildPreviewPdfPath(id),
    ...pages.map((page) => page.storagePath),
  ]);

  revalidatePath("/books");
  revalidatePath("/");
  redirect("/books?deleted=1");
}

/* ------------------------------ asset finalize ----------------------------- */

export async function finalizeCoverUploadAction(payload: {
  bookId: string;
  path: string;
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
  const { bookId, path } = payload;
  if (!bookId || !path || !(await bookExists(bookId))) return actionError("Book not found.");
  if (!path.startsWith(`books/${bookId}/cover.`)) return actionError("Unexpected cover path.");
  if (!(await objectExists(path))) return actionError("Upload did not complete. Try again.");

  const previous = (await getBook(bookId))?.coverImagePath;
  await setBookAssetPath(bookId, "cover_image_path", path);
  if (previous && previous !== path) await removeObjects([previous]);

  revalidatePath(`/books/${bookId}/content`);
  revalidatePath(`/books/${bookId}`);
  return actionSuccess("Cover updated.");
}

export async function finalizePdfUploadAction(payload: {
  bookId: string;
  path: string;
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
  const { bookId, path } = payload;
  if (!bookId || !path || !(await bookExists(bookId))) return actionError("Book not found.");
  if (path !== buildPdfPath(bookId)) return actionError("Unexpected PDF path.");
  if (!(await objectExists(path))) return actionError("Upload did not complete. Try again.");

  await setBookAssetPath(bookId, "pdf_storage_path", path);
  // Ensure the book is marked as PDF content mode when a PDF is uploaded.
  const { updateBook } = await import("@/lib/books/repository");
  const book = await getBook(bookId);
  if (book) {
    await updateBook(bookId, {
      ...book,
      contentMode: "pdf",
      defaultMode: (book.defaultMode === "pdf" ? "pdf" : "flip") as "pdf" | "flip",
      flipEnabled: book.flipEnabled ?? true,
      pdfEnabled: book.pdfEnabled ?? true,
      isPublished: book.isPublished ?? false,
      previewPageCount: book.previewPageCount ?? 4,
      price: book.price ?? 0,
      offerPrice: book.offerPrice ?? null,
      deliveryCharge: book.deliveryCharge ?? 0,
      currency: book.currency ?? "BDT",
      pageAspectRatio: book.pageAspectRatio ?? 1.4,
      minZoom: book.minZoom ?? 0.75,
      maxZoom: book.maxZoom ?? 2.5,
      marketCountry: book.marketCountry ?? "Bangladesh",
      phoneRegion: book.phoneRegion ?? "BD",
    });
  }
  // The cached preview is now stale; remove it so the website re-trims the new PDF.
  await invalidatePreviewCache(bookId);
  await touchBook(bookId);

  revalidatePath(`/books/${bookId}/content`);
  revalidatePath(`/books/${bookId}`);
  return actionSuccess("PDF replaced. The website will serve the new preview.");
}

export async function finalizePageUploadAction(payload: {
  bookId: string;
  pageNumber: number;
  path: string;
  pageId?: string;
  alt?: string;
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
  const { bookId, pageNumber, path } = payload;
  if (!bookId || !path || !Number.isInteger(pageNumber) || pageNumber < 1) {
    return actionError("Invalid page upload request.");
  }
  if (!(await bookExists(bookId))) return actionError("Book not found.");
  if (!path.startsWith(`books/${bookId}/pages/`)) return actionError("Unexpected page path.");
  if (!(await objectExists(path))) return actionError("Upload did not complete. Try again.");

  try {
    if (payload.pageId) {
      const existing = await getPage(bookId, payload.pageId);
      if (!existing) return actionError("Page not found.");
      const previousPath = existing.storagePath;
      await updatePage(payload.pageId, {
        storagePath: path,
        ...(payload.alt !== undefined ? { alt: payload.alt } : {}),
      });
      if (previousPath && previousPath !== path) await removeObjects([previousPath]);
    } else {
      await createPage({
        bookId,
        storagePath: path,
        pageNumber,
        alt: payload.alt ?? null,
        isAvailable: true,
      });
    }
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Could not save the page.");
  }

  await touchBook(bookId);
  revalidatePath(`/books/${bookId}/content`);
  return actionSuccess("Page saved.");
}

export async function reorderPagesAction(payload: {
  bookId: string;
  orderedIds: string[];
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
  if (!payload.bookId || !Array.isArray(payload.orderedIds)) return actionError("Invalid reorder request.");
  try {
    await reorderPages(payload.bookId, payload.orderedIds);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Could not reorder pages.");
  }
  revalidatePath(`/books/${payload.bookId}/content`);
  return actionSuccess("Page order saved.");
}

/* --------------------------- form-based page actions ----------------------- */

export async function setPageAvailabilityFormAction(formData: FormData): Promise<void> {
  await guard();
  const bookId = String(formData.get("bookId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  const available = String(formData.get("available") ?? "") === "true";
  if (!bookId || !pageId) return;
  const page = await getPage(bookId, pageId);
  if (!page) return;
  await updatePage(pageId, { isAvailable: available });
  await touchBook(bookId);
  revalidatePath(`/books/${bookId}/content`);
}

export async function deletePageFormAction(formData: FormData): Promise<void> {
  await guard();
  const bookId = String(formData.get("bookId") ?? "");
  const pageId = String(formData.get("pageId") ?? "");
  if (!bookId || !pageId) return;
  const page = await getPage(bookId, pageId);
  if (!page) return;
  await deletePage(pageId);
  await removeObjects([page.storagePath]);
  await touchBook(bookId);
  revalidatePath(`/books/${bookId}/content`);
}
