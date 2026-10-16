# AGENTS.md — HSC English Last Hour Admin Dashboard

Guidance for humans and AI agents working in `bookproject-admin`. Read
`PROJECT_MEMORY.md` first for the durable project context, then the docs in
`docs/`.

## What this is

A standalone Next.js admin dashboard for the **HSC English Last Hour** website.
It shares the **same Supabase project** as the public website (repo
`../bookproject`). It manages the book catalog, uploaded assets (cover, PDF,
page images) and orders. It does **not** replace or restructure the website.

## Non-negotiable rules

- **Do not create** a new Supabase project or storage bucket. Reuse
  `book-assets`.
- **Never make** the `book-assets` bucket public, and **never expose** the full
  book PDF publicly.
- **Never** put secrets in git, logs, docs, or agent memory. Real values live
  only in `.env.local` (gitignored).
- **No fake/seed data.** All figures are read from the real database.
- **Do not reset or drop** the database, and do not run destructive remote
  operations without explicit owner approval.
- **Pause and ask** before: granting/revoking admin membership, deleting
  production assets, changing remote bucket policies, or any irreversible
  production operation.
- The public website is **read-only reference**. Only minimal, additive changes
  there if strictly required (and always verified).

## Commands

```bash
npm run dev          # local dev (Turbopack)
npm run build        # production build
npm run start        # serve the build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest run

npm run supabase:migrations   # list local vs remote migrations
npm run supabase:types        # regenerate types/database.ts from the remote DB

# Grant admin access (owner action; reads .env.local, never logs the password)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create
```

Run `lint`, `typecheck`, `test`, and `build` before considering work done.

## Architecture at a glance

- **Auth:** Supabase Auth (`signInWithPassword`). Successful login is not
  enough — server checks `admin_users` membership with the service-role client.
- **Authorization:** `lib/auth/dal.ts` (`requireAdmin` for pages/routes,
  `requireAdminAction` for server actions). Deny by default.
- **Data access:** server-only service-role client (`lib/supabase/admin.ts`)
  after the admin check. Needed because column-level grants hide internal
  storage paths from `authenticated`.
- **Uploads:** browser → private Storage via short-lived **signed upload URLs**
  (`app/api/admin/uploads/sign`). Metadata is finalized by server actions.
- **Storage paths** must match the website (`lib/storage/paths.ts` ↔
  `bookproject/lib/book/storage-paths.ts`).

See `docs/ARCHITECTURE.md` and `docs/SECURITY.md` for detail.

## Key files

| Area | File |
| --- | --- |
| Proxy (Next 16 middleware) | `proxy.ts` |
| Auth session + allow-list | `lib/auth/session.ts`, `lib/auth/dal.ts`, `lib/auth/actions.ts` |
| Supabase clients | `lib/supabase/{config,admin,server,browser,storage}.ts` |
| Book repo + actions | `lib/books/{repository,actions}.ts` |
| Order repo + actions | `lib/orders/{repository,customers,actions}.ts` |
| Validation | `lib/validation/{book,order,upload}.ts` |
| Storage paths | `lib/storage/paths.ts` |
| UI primitives | `components/ui/*` |
| Routes | `app/**` |

## Conventions

- TypeScript strict, no `any`. Prefer the repository/validation layers over ad
  hoc Supabase calls.
- Server-only modules import `server-only`; never import them into client
  components.
- **Public env must be read statically** (`process.env.NEXT_PUBLIC_X`); dynamic
  `process.env[name]` is not inlined by Next and is `undefined` in the browser.
  Never reference the secret key from client-reachable code. See
  `lib/supabase/config.ts`.
- **Theming:** colour tokens are CSS variables toggled by `data-theme` on
  `<html>` (see `app/globals.css`, `lib/theme.ts`, `components/theme/`). Use the
  `--color-*` tokens (or the remapped overlay utilities) rather than hard-coded
  colours so both themes stay readable.
- Add tests for pure logic under `tests/*.test.ts`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
