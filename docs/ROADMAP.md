# Roadmap / known limitations

## Improvements

- **Atomic page reordering.** `reorderPages` uses a two-phase offset update to
  avoid unique-constraint collisions without a transaction. A future migration
  could expose an atomic `reorder_book_pages(book_id, uuid[])` SQL function
  (SECURITY DEFINER, admin-only) and call it via `rpc`. Until then, re-running a
  reorder repairs a partially-applied order.
- **Server-side bucket limits.** The `book-assets` bucket has no
  `file_size_limit`/`allowed_mime_types`. Limits are enforced in app code; the
  remote policy could mirror them once approved.
- **Optimistic concurrency.** Book edits overwrite without a version check.
- **Customer identity.** Customers are keyed by raw phone string; normalizing
  numbers would merge formatting variants.
- **Bulk actions.** No bulk publish/status changes yet.
- **Audit log.** No record of which admin changed what; consider an
  `admin_audit_log` table.
- **Pagination for books/customers.** Currently loads all rows (fine for a
  small catalog).

## Website cache-busting (optional)

If the website ever serves a stale preview, append a version query parameter
(e.g. `&v=<books.updated_at>`) to `pdfUrl` in a minimal, additive website
change.

## Do not do without owner approval

- Creating projects/buckets, changing bucket policies, granting/revoking admin,
  deleting production data, or adding migrations.
