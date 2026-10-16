# PROJECT_MEMORY.md — durable context

## Purpose

`bookproject-admin` is a **separate admin dashboard** for the **HSC English
Last Hour** website. It connects to the **same Supabase project** as the public
website (repo `../bookproject`) and manages the book catalog, its uploaded
assets, and customer orders.

It exists because the public website is intentionally minimal and read-safe.
Administration needs privileged operations (uploading a PDF, editing pricing,
moving order statuses) that should never be available on the public app.

## Hard constraints (do not violate)

1. **One Supabase project, one bucket.** Project ref is the same as the
   website's; the storage bucket is `book-assets`. Never create new ones.
2. **The bucket stays private.** Never publish it, never expose the full PDF.
3. **No secrets in the repo, docs, logs or memory.** Values live in `.env.local`.
4. **No fabricated data.** Every number comes from the database.
5. **No destructive DB operations** without explicit owner approval. Never
   reset/drop. Never change remote policies without approval.
6. **Pause and ask** before grant/revoke admin, deleting production assets, or
   any irreversible production action.
7. **The website is a read-only reference.** Only minimal additive changes if
   strictly required.

## Verified environment facts

- Supabase project: shared with the website. Bucket `book-assets` is **private**
  (`public=false`) with `file_size_limit = 52428800` (50 MiB) and
  `allowed_mime_types = [application/pdf, image/jpeg, image/png, image/webp]`
  (verified via the admin API). The dashboard enforces stricter per-kind limits
  in application code (PDF ≤ 50 MiB, images ≤ 15 MiB) and mirrors the bucket's
  MIME allow-list — uploading an unsupported type (e.g. avif/gif) is rejected
  app-side instead of failing at Storage.
- Column-level grants hide internal storage paths (`books.pdf_storage_path`,
  `books.cover_image_path`, `book_pages.storage_path`) from the `authenticated`
  role. This is why the dashboard uses the service-role client after its own
  admin check rather than the user-scoped client.
- `admin_users` has **no PostgREST access** for `authenticated`; membership is
  checked with the service-role client.
- The website only collects **name, phone, address** at checkout. There is no
  `customers` table; customers are derived from orders by phone number.
- Local and remote migrations were in sync when this dashboard was built (five
  migrations). No schema changes were introduced by the dashboard.

## Design decisions

- **Auth ≠ authorization.** A valid Supabase Auth session is not enough.
  `admin_users` membership is required and checked server-side. Non-admins are
  signed out immediately on login.
- **Optimistic vs authoritative checks.** `proxy.ts` refreshes the session and
  does an optimistic redirect; the authoritative check is `requireAdmin()`
  (pages) / `requireAdminAction()` (server actions).
- **Service-role after check.** All privileged reads/writes use
  `getSupabaseAdminClient()` only after an admin check.
- **Signed-URL uploads.** Browser uploads large binaries directly to private
  Storage with short-lived signed URLs; the secret key never reaches the
  browser and Next.js body limits do not apply.
- **Website cache invalidation.** Replacing a PDF deletes the cached
  `preview.pdf` so the website regenerates it. Book `updated_at` is touched to
  notify the website (Realtime + polling + focus refresh).
- **Revenue definition.** Sum of `total_amount` for all statuses except
  `cancelled`.
- **Order statuses.** `pending → confirmed → packed → shipped → delivered`,
  with `cancelled` allowed from any non-terminal state. Terminal states cannot
  transition further.
- **Page reordering** uses a non-transactional two-phase offset update (see
  `docs/ROADMAP.md` for the intended atomic RPC improvement).
- **Static public env access.** `NEXT_PUBLIC_*` variables MUST be read as static
  literals (`process.env.NEXT_PUBLIC_X`). Next.js only inlines those into the
  browser bundle; dynamic `process.env[name]` evaluates to `undefined` on the
  client. Getting this wrong nulls the browser Supabase client — which broke
  uploads here **and** silently disabled the website's Realtime subscription
  (both fixed; see `docs/CHANGELOG.md` 0.1.1).
- **Theming.** Colour tokens in `app/globals.css` are CSS variables toggled by a
  `data-theme="light|dark"` attribute set on `<html>` before first paint. The
  light theme remaps the dark-only translucent-white overlays and status-tone
  text. Preference (`light|dark|system`) is stored in `localStorage` under
  `admin-theme`.

## State of the work

- Phases 0–6 complete: inspection, scaffold/auth, dashboard + books, storage
  uploads, orders/customers, website-integration awareness, tests and docs.
- Bug-fix pass (0.1.1): browser public-env inlining (dashboard + website),
  unchecked-checkbox validation, and a full Light/Dark/System theme.
- An admin account exists and can sign in (`hscenglish38@gmail.com`). Additional
  administrators are granted with `npm run admin:create` (owner-run).
- Verification: admin `lint`/`typecheck`/`test` (50) /`build` pass; website
  `lint`/`typecheck`/`test` (52)/`build` pass. Read-only storage diagnostic
  passes (bucket list + signed-upload token). A full browser upload test
  requires a production write and is pending owner approval.

