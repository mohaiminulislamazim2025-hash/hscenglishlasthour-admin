# Roadmap / known limitations

## Improvements

- **Optimistic concurrency.** Product edits overwrite without a version check.
- **Customer identity.** Customers are keyed by the raw mobile string;
  normalizing numbers would merge formatting variants.
- **Bulk actions.** No bulk availability/delete yet.
- **Audit log.** No record of which admin changed what; consider an
  `admin_audit_log` table.
- **Pagination for products/customers.** Currently loads all rows (fine for a
  small catalog).
- **Image variants.** Only one image per product; thumbnails/multiple angles
  would need a schema and storefront change.
- **Server-side bucket limits.** Consider mirroring the app-side 5 MB image limit
  in the bucket's `file_size_limit`/`allowed_mime_types` once approved.

## Storefront cache-busting (optional)

If the storefront ever serves a stale image, append a version query parameter
(e.g. `?v=<products.updated_at>`) to the resolved image URL in a minimal,
additive storefront change.

## Do not do without owner approval

- Creating projects/buckets, changing bucket policies, granting/revoking admin,
  deleting production data, or adding migrations.
