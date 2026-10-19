# Security

## Principles

- **Deny by default.** Every page, route handler and server action performs its
  own authorization check. Nothing is protected only by the UI.
- **Least privilege.** The browser only ever receives the publishable key and
  short-lived signed upload URLs. The secret/service-role key stays server-side.
- **No self-service admin.** Public sign-up is disabled; administrators are
  added manually to `admin_users`.

## Authentication vs authorization

A valid Supabase Auth session proves *who* the user is, not *what* they may do.
Authorization requires membership in `admin_users`, checked with the
service-role client because that table has no PostgREST access for
`authenticated`.

- `lib/auth/dal.ts`:
  - `requireAdmin()` → pages/routes (redirects).
  - `requireAdminAction()` → server actions (throws).
  - `getAdminSession()` → route handlers (returns `null`).
- `proxy.ts` only refreshes the session and does an optimistic redirect; it is
  **not** the security boundary.

Non-admin logins are signed out immediately and shown the `/unauthorized` page.

## Secrets

- Real values live only in `.env.local` (gitignored).
- `.env.example` documents the variable names with empty values.
- The secret key is read exclusively in `server-only` modules
  (`lib/supabase/admin.ts`). Never import those into client components.
- **How env reaches the browser:** only `NEXT_PUBLIC_*` values are inlined, and
  only when accessed as static literals (`process.env.NEXT_PUBLIC_X`) so Next.js
  can replace them at build time. Dynamic access is not inlined. Never reference
  a secret variable (`SUPABASE_SECRET_KEY`/`SUPABASE_SERVICE_ROLE_KEY`) in any
  module reachable from client code.

## Storage

- The `book-assets` bucket is **private**. It must never be made public.
- The full book PDF is never served to the public website or anonymous users.
- The dashboard enforces policies in code:
  - PDF: ≤ 50 MB, `application/pdf`.
  - Images: ≤ 15 MB, `webp/jpeg/png`.
- The bucket's server-side policy is aligned (`file_size_limit 50 MiB`,
  `allowed_mime_types: application/pdf,image/jpeg,image/png,image/webp`). App
  policy is intentionally stricter for images (15 MB) and narrower in MIME
  (`avif`/`gif` are not currently supported) to match the bucket allow-list.

## Server Actions

- Every action calls `requireAdminAction()` first.
- Zod schemas validate and coerce all form input.
- Destructive actions (delete book, delete page, cancel order) require explicit
  confirmation in the UI.

## First-run setup (no admin exists yet)

The supported way to grant admin access is the deliberate owner script — it
creates the Auth user (email confirmed) and inserts the `admin_users` row in one
step, and never prints the password:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create
```

It reads the secret key from `.env.local`. Re-running with the same email
updates the password (no duplicate user, no duplicate allow-list row).

Manual alternative:

1. In Supabase → **Authentication → Users**, create a user with an email and
   password. Do not enable public sign-up.
2. Copy that user's **UID**.
3. Insert a row into `admin_users` with `user_id = '<uid>'` (via the Supabase
   dashboard, SQL editor, or a trusted script). Use the service role.
4. Sign in at `/login` with that email/password.

Prefer the script (or the Supabase dashboard UI) over ad hoc SQL so membership
changes remain explicit and auditable.

## Reporting

Do not disclose secrets in issues, logs, or agent output. Rotate the secret key
in Supabase if it is ever exposed.
