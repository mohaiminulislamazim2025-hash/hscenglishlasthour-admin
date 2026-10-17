# Architecture

## High level

```
Browser ──▶ Next.js (App Router, app/**)
              │
              ├─ proxy.ts            session refresh + optimistic redirect
              ├─ (dashboard)/**      protected pages (requireAdmin)
              ├─ app/login           public sign-in
              ├─ app/print/**        public invoice (requires admin)
              └─ app/api/**
                    ├─ admin/uploads/sign  → signed upload URL (admin only)
                    └─ admin/*
              │
              ▼
        Supabase (shared project)
          ├─ Postgres: products, orders, order_items, store_settings
          ├─ Auth: signInWithPassword + app_metadata.role
          └─ Storage: nuri-product-images (private, signed URLs)
```

## Authorization

- `lib/auth/session.ts`: `getAuthUser()`, `hasAdminRole(user)`.
  `hasAdminRole` returns true when `user.app_metadata.role === "admin"` **or**
  the user's email is in the server-only `ADMIN_EMAILS` allow-list.
- `lib/auth/dal.ts`: `getAdminSession()`, `requireAdmin()` (redirects),
  `requireAdminAction()` (throws `AuthorizationError`).
- `proxy.ts`: refreshes the Supabase session cookie and performs an optimistic
  redirect. It is **not** the authoritative check.

## Data access

- `lib/supabase/admin.ts`: server-only secret-key client, used after the admin
  check. The client is created with the generated `Database` type.
- Repositories (`lib/products`, `lib/orders`, `lib/settings`) are the only place
  that talks to Postgres; pages/actions call repositories.
- `lib/dashboard/stats.ts` adds `getOverviewStats()`.

## Uploads

1. Browser calls `POST /api/admin/uploads/sign` with `{ productId, filename,
   contentType, size }`.
2. The route checks admin, validates metadata, confirms the product exists, and
   returns a short-lived signed upload URL (`path`, `token`, `bucket`).
3. The browser uploads directly to Storage via `uploadToSignedUrl`.
4. A server action (`finalizeProductImageUploadAction`) sets `products.image_path`
   and deletes the previous object.

Product ids are UUIDs, so products are created before their image is uploaded.

## Storage paths

`lib/storage/paths.ts`:

- `products/{productId}/image.{ext}` (canonical image path)

These must match the storefront's storage-path module.

## Rendering

- Dashboard routes are dynamic (`force-dynamic`) and read live data.
- Theming: `data-theme` on `<html>`, set by a pre-paint inline script.
