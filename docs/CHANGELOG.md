# Changelog

## 0.1.1 — Bug fixes & theming

### Fixed

- **Browser Supabase client initialised as `null`**, so storage uploads failed
  with “Storage client is unavailable (Supabase not configured).” Root cause:
  public env vars were read via dynamic `process.env[name]`, which Next.js does
  **not** inline into client bundles. `lib/supabase/config.ts` now uses static
  `process.env.NEXT_PUBLIC_*` access (verified: the project URL/key are present
  in the built client chunks).
- **Book saves silently failed** whenever a checkbox (`flipEnabled`,
  `pdfEnabled`, `isPublished`) was unchecked. An unchecked box is absent from
  `FormData`, and the Zod `booleanish` schema rejected `undefined`, failing the
  whole form — which also blocked creating an unpublished book and editing the
  price. A missing checkbox key is now `false`.
- The **same dynamic-env bug** existed in the website (`../bookproject`),
  silently disabling its Realtime subscription in `BookProvider`. Fixed
  identically so price/content edits propagate live.

### Added

- **Light / Dark / System theme** with a toggle in the top bar and on the login
  screen, `localStorage` persistence, and a pre-paint inline script (no flash of
  the wrong theme). Overlays, status tones, surfaces and the spinner adapt; the
  invoice print sheet stays light regardless of theme.
- `lib/theme.ts` + `components/theme/ThemeToggle.tsx`; the resolved theme is
  applied as `data-theme` on `<html>`.
- The app's upload policy was aligned to the actual bucket allow-list (removed
  `image/avif` and `image/gif` support), preventing a Storage-layer MIME
  rejection after validation. The settings UI and file picker reflect this.
- Corrected bucket configuration in documentation (it **does** enforce
  `file_size_limit 50 MiB` and an `allowed_mime_types` list).

## 0.1.0 — Initial dashboard

### Added

- Standalone Next.js 16 admin app connected to the existing Supabase project
  and private `book-assets` bucket.
- Authentication and strict authorization: Supabase Auth sign-in plus
  `admin_users` allow-list enforcement (`lib/auth/*`).
- Dashboard shell with responsive sidebar/topbar and sign-out.
- **Overview**: real book/order/revenue statistics and recent activity.
- **Books**: list, create, edit, publish/unpublish, delete (blocked when orders
  reference the book).
- **Content**: cover and PDF upload/replace via signed upload URLs; page image
  add/replace/hide/delete/reorder; PDF cache invalidation.
- **Orders**: filterable, paginated list; detail view with forward-only status
  transitions; printable invoice.
- **Customers**: aggregation derived from orders by phone number.
- **Settings** and **Admin account**: read-only environment/security info and
  administrator allow-list.
- Validation (Zod), storage helpers, and 44 unit tests.
- `scripts/create-admin.mjs` (`npm run admin:create`) — the supported, owner-run
  way to create an Auth user and grant admin access without logging secrets.
- Documentation (`AGENTS.md`, `PROJECT_MEMORY.md`, `docs/*`).

### Fixed

- Empty `offer_price` input now resolves to `null` instead of `0`.

### Notes

- No database migrations were added; the dashboard uses the website's schema
  unchanged.
- No admin account exists yet — see `docs/SECURITY.md` for first-run setup.
