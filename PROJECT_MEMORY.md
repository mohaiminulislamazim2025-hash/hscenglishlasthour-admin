# PROJECT_MEMORY.md — durable context

> **Note:** This dashboard has been rebranded from the former **HSC English
> Last Hour** book admin to the **Nuri Shirt Store** product/order admin, and now
> targets the **Nuri** Supabase project. See **`NURI_PROJECT_MEMORY.md`** for the
> current, authoritative durable context. The book-era details below are kept
> only for historical reference and are **no longer accurate**.

## Current purpose

`bookproject-admin` is a **separate admin dashboard** for the **Nuri Shirt
Store** website. It connects to the **same Supabase project** as the public
storefront (repo `../bookproject`) and manages the product catalog, product
images, orders and store settings.

## Hard constraints (do not violate)

1. **One Supabase project, one bucket.** Do not create new ones. Reuse the Nuri
   project and its product-images bucket (`nuri-product-images`).
2. **The bucket stays private.** Never publish it.
3. **No secrets in the repo, docs, logs or memory.** Values live in `.env.local`.
4. **No fabricated data.** Every number comes from the database.
5. **No destructive DB operations** without explicit owner approval.
6. **Pause and ask** before grant/revoke admin, deleting production assets, or
   any irreversible production action.
7. **The storefront is a read-only reference.**

## Design decisions

- **Auth ≠ authorization.** A valid Supabase Auth session is not enough.
  `hasAdminRole()` requires `app_metadata.role === "admin"` or membership in the
  optional server-only `ADMIN_EMAILS` allow-list. Non-admins are signed out on
  login.
- **Optimistic vs authoritative checks.** `proxy.ts` refreshes the session and
  does an optimistic redirect; the authoritative check is `requireAdmin()`
  (pages) / `requireAdminAction()` (server actions).
- **Secret-key client after check.** All privileged reads/writes use
  `getSupabaseAdminClient()` only after an admin check.
- **Signed-URL uploads.** The browser uploads directly to private Storage with a
  short-lived signed upload URL; the secret key never reaches the browser.
- **Image paths.** `products/{productId}/image.{ext}` — mirrors the storefront's
  convention.
- **Revenue definition.** Sum of `total_bdt` for all statuses except `cancelled`.
- **Order statuses.** `pending → confirmed → packed → shipped → delivered`, with
  `cancelled` allowed from any non-terminal state.
- **Static public env access.** `NEXT_PUBLIC_*` variables MUST be read as static
  literals (`process.env.NEXT_PUBLIC_X`); dynamic `process.env[name]` is
  `undefined` in the browser.
- **Theming.** `data-theme="light|dark"` on `<html>`, set before paint;
  preference stored in `localStorage` under `admin-theme`.

## State of the work

- Rebrand complete. `lint`, `typecheck`, `test` (47) and `build` pass.
- **Blocker:** the server secret key was empty in `.env.local`; privileged
  operations are implemented but were not exercised end to end.
