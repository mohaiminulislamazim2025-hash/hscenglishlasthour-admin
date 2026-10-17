# Security

## Principles

- **Deny by default.** Every page, server action and route handler checks
  authorization before touching data.
- **Auth ≠ authorization.** A valid Supabase Auth session is not enough.
  `hasAdminRole()` must also pass (`app_metadata.role === "admin"` or
  `ADMIN_EMAILS` allow-list). Non-admins are signed out immediately on login.
- **Least privilege.** The browser only ever holds the publishable key. All
  privileged database and storage access uses the server-only secret-key client.
- **Secrets stay server-side.** `SUPABASE_SECRET_KEY` and `ADMIN_EMAILS` are
  never referenced from client-reachable code and never prefixed with
  `NEXT_PUBLIC_`.

## Uploads

- The browser uploads directly to Storage using a short-lived signed upload URL
  minted by `POST /api/admin/uploads/sign` (admin-only).
- Metadata is validated (`lib/validation/upload.ts`): images only,
  webp/jpeg/png/avif, ≤ 5 MB.
- Object paths are constrained to `products/{productId}/image.{ext}`.
- The bucket is never made public.

## Storage bucket

`nuri-product-images` must remain private. Do **not** loosen its policies or add
public access. The dashboard issues signed URLs for previews so it works whether
the bucket is public or private, but the bucket should stay private.

## Environment

- `.env.local` is gitignored and must never be committed.
- Public vars are read as **static literals** (`process.env.NEXT_PUBLIC_X`)
  because Next only inlines those into the browser bundle.
- `.env.example` contains placeholders only.

## Admin access

- Granting/revoking admin is a **pause-and-ask** operation.
- Add an admin by setting `app_metadata.role = "admin"` on their Supabase Auth
  user (or listing their email in `ADMIN_EMAILS`). There is no public sign-up.

## Guardrails

- Do not reset/drop the database.
- Do not delete production assets or change remote bucket policies without owner
  approval.
- Do not introduce fake/seed data — all figures come from the real database.
