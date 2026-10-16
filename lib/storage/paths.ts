/**
 * Canonical object-path conventions inside the private `book-assets` bucket.
 * These MUST match the public website (`bookproject/lib/book/storage-paths.ts`)
 * so that dashboard uploads are picked up by the website automatically.
 *
 *   books/{bookId}/cover.{ext}          cover image
 *   books/{bookId}/book.pdf             full book PDF (never served publicly)
 *   books/{bookId}/preview.pdf          optional pre-trimmed preview PDF (cache)
 *   books/{bookId}/pages/{n}.{ext}      individual page images (3-padded)
 */

export function normalizeExt(extension: string): string {
  return extension.replace(/^\./, "").toLowerCase();
}

/** Derive a safe, single-segment extension from a filename (default `bin`). */
export function extensionFromFilename(filename: string, fallback = "bin"): string {
  const clean = filename.split(/[?#]/)[0] ?? "";
  const dot = clean.lastIndexOf(".");
  if (dot <= 0 || dot === clean.length - 1) return fallback;
  const ext = normalizeExt(clean.slice(dot + 1));
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : fallback;
}

export function buildCoverPath(bookId: string, extension = "webp"): string {
  return `books/${bookId}/cover.${normalizeExt(extension)}`;
}

export function buildPdfPath(bookId: string): string {
  return `books/${bookId}/book.pdf`;
}

export function buildPreviewPdfPath(bookId: string): string {
  return `books/${bookId}/preview.pdf`;
}

export function buildPagePath(bookId: string, pageNumber: number, extension = "webp"): string {
  return `books/${bookId}/pages/${String(pageNumber).padStart(3, "0")}.${normalizeExt(extension)}`;
}

export function bookFolder(bookId: string): string {
  return `books/${bookId}`;
}
