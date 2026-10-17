# NURI_PROJECT_MEMORY.md — durable context

This admin dashboard was rebranded from the former **HSC English Last Hour**
book admin to the **Nuri Shirt Store** product/order admin. It now targets the
**Nuri** Supabase project (not the old book project).

## Purpose

A separate, privileged admin dashboard for the **Nuri Shirt Store** storefront.
It shares the **same Supabase project and storage bucket** as the public site and
manages the product catalog, product images, orders and store settings.

## Hard constraints (do not violate)

1. **Do not create** a new Supabase project or storage bucket. Reuse the Nuri
   project and its product-images bucket (`nuri-product-images`).
2. **Never** make the bucket public.
3. **Never** put secrets in git, logs, docs, or agent memory. Values live only in
   `.env.local` (gitignored).
4. **No fabricated data.** Every number comes from the database.
5. **No destructive DB operations** without explicit owner approval. Never
   reset/drop. Never change remote policies without approval.
6. **Pause and ask** before grant/revoke admin, deleting production assets, or
   any irreversible production action.
7. The public storefront is a **read-only reference**; only minimal, additive
   changes there if strictly required.

## Verified environment facts

- Supabase project: the Nuri project (URL configured via `NEXT_PUBLIC_SUPABASE_URL`).
  The publishable key is public by design; the secret key is server-only.
- Storage bucket: `nuri-product-images`, accessed from the browser only through
  short-lived signed upload URLs. Public/private status must not be loosened.
- Live schema (confirmed):
  - `products(id uuid, name, description, price_bdt numeric, image_path,
    is_available bool, stock_quantity int, sort_order int, created_at, updated_at)`
  - `orders(id uuid, customer_name, customer_mobile, customer_address,
    payment_method, status, delivery_charge_bdt, subtotal_bdt, total_bdt,
    created_at, updated_at)`
  - `order_items(id uuid, order_id uuid, product_id uuid, product_name,
    quantity, unit_price_bdt, line_total_bdt, created_at)`
  - `store_settings(id int = 1, delivery_charge_bdt numeric, currency text,
    updated_at)`
- The storefront collects **name, mobile and address** only. There is no
  customers table; customers are derived from orders by **mobile number**.
- Admin authorization is **not** a database table. It is the Supabase Auth user's
  `app_metadata.role === "admin"`, with an optional server-only `ADMIN_EMAILS`
  allow-list.

## Design decisions

- **Auth ≠ authorization.** A valid Supabase Auth session is not enough.
  `hasAdminRole()` must also pass; non-admins are signed out on login.
- **Optimistic vs authoritative checks.** `proxy.ts` refreshes the session and
  does an optimistic redirect; the authoritative check is `requireAdmin()`
  (pages) / `requireAdminAction()` (server actions).
- **Secret-key client after check.** All privileged reads/writes use
  `getSupabaseAdminClient()` only after an admin check.
- **Signed-URL uploads.** The browser uploads directly to private Storage with a
  short-lived signed upload URL; the secret key never reaches the browser and
  Next.js body limits do not apply. Product ids are UUIDs, so create the product
  first, then upload/replace its image.
- **Image paths.** `products/{productId}/image.{ext}` — mirrors the storefront
  convention (`lib/storage/paths.ts` ↔ the storefront's storage-paths module).
- **Revenue definition.** Sum of `total_bdt` for all statuses except `cancelled`.
- **Order statuses.** `pending → confirmed → packed → shipped → delivered`, with
  `cancelled` allowed from any non-terminal state. Terminal states cannot
  transition further.
- **Static public env access.** `NEXT_PUBLIC_*` variables MUST be read as static
  literals (`process.env.NEXT_PUBLIC_X`). Next.js only inlines those into the
  browser bundle; dynamic `process.env[name]` evaluates to `undefined` on the
  client.
- **Theming.** Colour tokens in `app/globals.css` are CSS variables toggled by a
  `data-theme="light|dark"` attribute set on `<html>` before first paint.
  Preference (`light|dark|system`) is stored in `localStorage` under
  `admin-theme`.

## State of the work

- Rebrand complete: products/orders/customers/settings screens, product-image
  upload flow, `app_metadata.role` authorization, and Nuri branding.
- Verification: admin `lint`/`typecheck`/`test` (47) /`build` pass.
- **Blocker:** the server secret key was empty in `.env.local` at the time of
  writing, so privileged operations (product create/edit, image upload, order
  status change, delivery-charge change) are implemented but could not be
  exercised end to end. Fill `SUPABASE_SECRET_KEY` and verify.
- The old book bucket (`book-assets`) and old project are **not** used by this
  dashboard anymore.
