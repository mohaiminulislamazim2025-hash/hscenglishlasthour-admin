# Architecture

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict).
- Tailwind CSS v4 (theme tokens in `app/globals.css`).
- Supabase: `@supabase/ssr` (auth/session) + `@supabase/supabase-js`
  (data + storage).
- Zod for validation. Vitest + Testing Library for tests.

## Layers

```
app/**                    routes (server components by default)
  (dashboard)/**          authenticated shell (sidebar + topbar)
  login, unauthorized,
  print/orders/[id]       standalone pages
components/**             UI (ui/* primitives, feature folders)
lib/**                    server logic, data access, validation, storage
types/**                  database types + domain types
proxy.ts                  Next 16 middleware (session refresh)
```

## Authentication & authorization

1. **Sign-in** (`lib/auth/actions.ts`): `signInWithPassword`. On success the
   user is checked against `admin_users`. If not a member, the session is
   destroyed immediately.
2. **Session refresh** (`proxy.ts`): refreshes the auth cookie and performs an
   *optimistic* redirect for unauthenticated requests. This is not the security
   boundary.
3. **Authoritative check** (`lib/auth/dal.ts`):
   - `requireAdmin()` — pages/routes. Redirects to `/login` or `/unauthorized`.
   - `requireAdminAction()` — server actions. Throws `AuthorizationError`.
   - `getAdminSession()` — route handlers; returns `null` instead of redirecting.
   - Membership is read from `admin_users` via the service-role client and
     memoized per render with React `cache`.

The dashboard layout (`app/(dashboard)/layout.tsx`) calls `requireAdmin()`, so
every nested page is protected. Every server action and the upload-signing
route re-checks independently (defense in depth).

## Data access

- **Privileged** reads/writes go through `getSupabaseAdminClient()`
  (`lib/supabase/admin.ts`, `server-only`) **after** an admin check. It bypasses
  RLS and column grants — which is required because internal storage paths are
  hidden from `authenticated`.
- Repositories encapsulate queries: `lib/books/repository.ts`,
  `lib/orders/repository.ts`, `lib/orders/customers.ts`,
  `lib/dashboard/stats.ts`.
- Validation lives in `lib/validation/*` and is applied at the action boundary.

## Uploads

1. The client asks `POST /api/admin/uploads/sign` for a signed upload URL. The
   route verifies admin membership, validates the declared file metadata
   (`lib/validation/upload.ts`), and mints a short-lived token for the exact
   destination path.
2. The browser uploads the file **directly** to private Storage with
   `uploadToSignedUrl` (`lib/upload/client.ts`). The secret key never leaves the
   server and body-size limits do not apply.
3. A server action (`finalize*UploadAction`) verifies the object exists, updates
   the database pointer, removes any replaced object, touches the book, and
   revalidates affected routes.

See `docs/WEBSITE_INTEGRATION.md` for path conventions and cache invalidation.

## Rendering

- Dashboard routes are dynamic (`export const dynamic = "force-dynamic"`) since
  they read live data. Mutations use Server Actions + `revalidatePath`.
- Client components are limited to interactivity: uploads, reorder buttons,
  status controls, forms with `useActionState`, and the app shell.

## Configuration & environment

- Public config (`lib/supabase/config.ts`) reads `NEXT_PUBLIC_*` via **static**
  `process.env.NEXT_PUBLIC_X` access only, so Next inlines the values into the
  browser bundle. Dynamic reads (`process.env[name]`) are **not** inlined and are
  `undefined` on the client — this previously made the browser client `null`.
- The secret/service-role key is read at runtime inside `server-only` modules and
  never reaches the client.
- Public vars are inlined at build time: changing `.env.local` requires a
  restart/rebuild.

## Theming

- Colour tokens live in `app/globals.css` as CSS variables. Dark is the default;
  `:root[data-theme="light"]` overrides the palette plus the translucent-white
  overlay utilities and status-tone text (which otherwise assume a dark surface).
- `lib/theme.ts` owns the preference model; `components/theme/ThemeToggle.tsx`
  renders the Light/Dark/System control and uses `useSyncExternalStore` to track
  the preference and the OS media query.
- `app/layout.tsx` injects a pre-paint inline script and sets
  `suppressHydrationWarning` on `<html>`, so there is no flash of the wrong
  theme.

