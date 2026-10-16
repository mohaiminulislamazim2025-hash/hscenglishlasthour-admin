# HSC English Last Hour Admin Panel

A standalone Next.js admin dashboard for managing the **HSC English Last Hour** website. It connects to the same Supabase project and storage bucket as the public website, providing secure administrative tools for catalog, assets, and orders.

## Overview

This admin panel enables administrators to manage the book catalog, upload and replace cover images/PDFs and page images, control publication status, manage orders and customer records, and monitor key metrics. It is a separate repository (not the public storefront). All privileged operations use a server-side service-role client after strict admin authorization.

## Features

### Implemented
- **Authentication & authorization**: Supabase Auth (email/password) with `admin_users` allow-list; non-admins are signed out; server-side guards for pages, actions, and API routes.
- **Dashboard overview**: Real statistics (books, published, orders, revenue excluding cancelled) and recent activity.
- **Books**: List, create, edit (pricing, settings, reading experience), publish/unpublish, delete (blocked if orders reference).
- **Content management**: Cover image upload/replace, full PDF upload/replace (private), page images add/replace/reorder/hide/delete, preview cache invalidation on PDF replace.
- **Orders**: Filterable/paginated list, detail view, forward-only status transitions, printable invoice.
- **Customers**: Aggregated from orders by phone number.
- **Settings & admins**: Security info, environment status, administrator list; admin creation via owner script.
- **Theming**: Light/Dark/System with persistence and pre-paint no-flash script.
- **Uploads**: Direct browser → private Storage via short-lived signed upload URLs; server-side validation and finalization.

### Notes
- Page reordering uses a two-phase offset update; revenue excludes cancelled orders; terminal states (delivered/cancelled) do not transition further.

## Technology Stack

- **Framework**: Next.js 16.4.0 (App Router, Turbopack)
- **React**: 19.3.0
- **Language**: TypeScript (strict, no `any`)
- **Styling**: Tailwind CSS v4
- **Backend/Auth/Storage**: Supabase (`@supabase/ssr` ^0.12.7, `@supabase/supabase-js` ^2.117.3)
- **Validation**: Zod ^4.6.7
- **UI/Utils**: clsx, tailwind-merge, class-variance-authority
- **Testing**: Vitest ^5.0.4, @testing-library/react, jsdom
- **Dev**: ESLint ^9, TypeScript ^5.9.2

## Architecture

- `app/`: Routes (App Router). `(dashboard)/` is protected shell; `login/`, `unauthorized/`, print routes are public where appropriate.
- `components/`: UI primitives and feature components (books, orders, theme, layout).
- `lib/`: Server logic (auth, supabase clients, books, orders, validation, storage, theme, upload).
- `proxy.ts`: Next 16 middleware (session refresh; authoritative checks in `lib/auth/dal.ts`).
- `types/`: Database and domain types.
- `tests/`: Unit tests for pure logic.
- `scripts/create-admin.mjs`: Owner-only admin creation.

Authorization: `requireAdmin()` (pages/routes), `requireAdminAction()` (server actions), `getAdminSession()` (route handlers). All privileged DB/storage uses server-only service-role client after checks.

## Prerequisites

- Node.js (matches project; see `package.json` engines if needed)
- npm
- Access to the shared Supabase project (same as public website)
- An authorized admin account (created via `npm run admin:create` or admin UI)

## Installation & Local Development

```bash
cd /Users/mohaiminul/Desktop/bookproject-admin
npm install
npm run dev
```
Dev server runs on `http://localhost:3001` (see `proxy.ts`/config). Website runs separately on `http://localhost:3000`.

Available commands:
```bash
npm run dev          # dev (Turbopack)
npm run build        # production build
npm run start        # serve build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run supabase:migrations
npm run supabase:types
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' npm run admin:create
```

## Environment Variables

Create `.env.local` (gitignored). Use `.env.example` as template. Only placeholders in example.

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) — server-only
- `SUPABASE_BOOK_BUCKET` — `book-assets` (do not change)

Notes:
- Public `NEXT_PUBLIC_*` must be read as static literals (dynamic `process.env[name]` is not inlined by Next).
- Never commit secrets. `.env.local` is gitignored.
- Only public vars reach browser; secrets stay server-side.

## Supabase & Database

- Same Supabase project as public website; bucket `book-assets` must remain private.
- Column-level grants hide internal storage paths from `authenticated` role → service-role client used after admin check.
- No new migrations added; uses existing schema. Do not reset/drop DB.
- Initial admin: run the owner script or insert into `admin_users` with the Auth UID.

## Security

- Deny-by-default: every page/action/handler checks authorization.
- Signed-URL uploads (secret never leaves server).
- Upload policy enforced in code (PDF ≤50MB, images ≤15MB; MIME aligned to bucket).
- Storage paths constrained; preview cache invalidated on PDF replace.
- Never expose full PDF publicly; bucket never public.
- Pause before granting/revoking admins, deleting production assets, or changing remote bucket policies.

## Build, Test, Deploy

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
All must pass before considering work done. Deployment not configured here.

## Troubleshooting

- Browser "Storage client is unavailable (Supabase not configured)": ensure `.env.local` has correct `NEXT_PUBLIC_*` and restart dev (env inlined at compile time).
- Checkbox/save failures: ensure checkboxes are handled (FormData may omit unchecked).
- Upload MIME/type/size rejected: matches bucket allow-list (`application/pdf,image/jpeg,image/png,image/webp`).
- Theme flash: inline script sets `data-theme` before paint.

## Project Status

Phases 0–6 complete; recent fixes for browser config inlining, boolean validation, MIME alignment, PDF→content-mode sync, and Light/Dark/System theme. 51 admin tests passing; typecheck/lint/build pass.

## License

Not specified in repository.

