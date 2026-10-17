# Nuri Shirt Store — Admin Dashboard

A standalone Next.js admin dashboard for managing the **Nuri Shirt Store**
website. It connects to the **same Supabase project and storage bucket** as the
public storefront, providing secure administrative tools for the product
catalog, product images, orders and store settings.

## Overview

Administrators can manage products (name, description, price, stock,
availability), upload/replace product images, review and progress orders, view
customers (derived from orders by mobile number), and edit the store's delivery
charge. This is a **separate repository** from the storefront. All privileged
operations use a server-only secret-key client **after** a strict admin
authorization check.

## Features

### Implemented
- **Authentication & authorization**: Supabase Auth (email/password). Successful
  login is not enough — the server additionally requires an admin claim
  (`app_metadata.role = "admin"`) or membership in the optional server-only
  `ADMIN_EMAILS` allow-list. Non-admins are signed out immediately.
- **Dashboard overview**: Live counts (products, available, low stock, orders,
  revenue excluding cancelled) and recent orders.
- **Products**: List/search/filter, create, edit (price, stock, description,
  availability), delete (blocked if orders reference the product).
- **Product images**: Upload/replace via direct browser → private Storage using
  short-lived signed upload URLs. The previous image is removed on replace.
- **Orders**: Filterable/paginated list, detail view with line items, forward-only
  status transitions, printable invoice.
- **Customers**: Aggregated from orders by mobile number.
- **Settings**: Delivery charge editor and integration/security information.
- **Theming**: Light/Dark/System with persistence and a pre-paint no-flash script.
- **Uploads**: Direct browser → private Storage via signed upload URLs;
  server-side validation and finalization.

### Notes
- Order status is forward-only: `pending → confirmed → packed → shipped →
  delivered`, with `cancelled` permitted from any non-terminal state. Terminal
  states do not transition further. Revenue excludes cancelled orders.
- Product ids are database-generated UUIDs, so a product is created **before**
  its image can be uploaded (upload/replace on the edit page).

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

- `app/`: Routes (App Router). `(dashboard)/` is the protected shell; `login/`,
  `unauthorized/`, print routes are public where appropriate.
- `components/`: UI primitives and feature components (products, orders, settings,
  theme, layout).
- `lib/`: Server logic (auth, Supabase clients, products, orders, settings,
  validation, storage, theme, upload).
- `proxy.ts`: Next 16 middleware (session refresh; authoritative checks live in
  `lib/auth/dal.ts`).
- `types/`: Database and domain types.
- `tests/`: Unit tests for pure logic.
- `scripts/create-admin.mjs`: Owner-only admin creation (legacy; prefer
  `app_metadata.role`).

Authorization: `requireAdmin()` (pages), `requireAdminAction()` (server actions),
`getAdminSession()` (route handlers). All privileged DB/storage access uses the
server-only secret-key client after checks.

## Prerequisites

- Node.js (matches project; see `package.json` engines if needed)
- npm
- Access to the shared Supabase project (same project as the public storefront)
- An authorized admin account (Supabase Auth user with the admin claim)

## Installation & Local Development

```bash
cd bookproject-admin
npm install
 cp .env.example .env.local   # then fill in real values
npm run dev
```

Dev server runs on `http://localhost:3001`. The storefront runs separately on
`http://localhost:3000`.

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
```

## Environment Variables

Create `.env.local` (gitignored). Use `.env.example` as a template. Only
placeholders appear in the example file.

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) — server-only
- `SUPABASE_BOOK_BUCKET` — product-images bucket (default `nuri-product-images`)

Optional:
- `ADMIN_EMAILS` — comma-separated server-only admin email allow-list

Notes:
- Public `NEXT_PUBLIC_*` must be read as static literals (dynamic
  `process.env[name]` is not inlined by Next).
- Never commit secrets. `.env.local` is gitignored.
- Only public vars reach the browser; secrets stay server-side.

## Supabase & Database

- Same Supabase project as the public storefront; the product-images bucket must
  remain private.
- Tables: `products`, `orders`, `order_items`, `store_settings`.
- No migrations are added by this dashboard; it uses the existing schema. Do not
  reset/drop the database.
- Admin access is granted via `app_metadata.role = "admin"` (or `ADMIN_EMAILS`),
  not a database table.

## Security

- Deny-by-default: every page/action/handler checks authorization.
- Signed-URL uploads (the secret key never leaves the server).
- Upload policy enforced in code (images ≤ 5 MB; webp/jpeg/png/avif).
- Storage paths constrained to `products/{id}/image.{ext}`.
- The product-images bucket is never made public; the secret key is never
  exposed to the browser.
- Pause before granting/revoking admin, deleting production assets, or changing
  remote bucket policies.

## Build, Test, Deploy

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

All must pass before considering work done.

## Troubleshooting

- Browser "Storage client is unavailable (Supabase not configured)": ensure
  `.env.local` has the correct `NEXT_PUBLIC_*` values and restart dev (env is
  inlined at compile time, so changes need a rebuild).
- Checkbox/save failures: unchecked checkboxes are omitted from `FormData`; the
  availability field is treated as false when absent.
- Upload rejected: the file must be webp/jpeg/png/avif and ≤ 5 MB.
- Theme flash: an inline script sets `data-theme` before first paint.

## Project Status

Rebranded from the former "HSC English Last Hour" book admin to the **Nuri Shirt
Store** product/order admin. `lint`, `typecheck`, `test` (47) and `build` pass.
See `NURI_PROJECT_MEMORY.md` for durable context.

## License

Not specified in repository.
