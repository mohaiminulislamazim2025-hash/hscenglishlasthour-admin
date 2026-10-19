# Website integration

The dashboard and the public website (`../bookproject`) share one Supabase
project and one private bucket. Coordination happens through the database and
the bucket's object paths — no shared code and no direct calls between apps.

## Storage paths (must match the website)

Defined in `lib/storage/paths.ts` and mirrored by
`bookproject/lib/book/storage-paths.ts`:

```
books/{bookId}/cover.{ext}        cover image
books/{bookId}/book.pdf           full book PDF (private, never public)
books/{bookId}/preview.pdf        cached pre-trimmed preview
books/{bookId}/pages/{n}.{ext}    page images, zero-padded to 3 digits
```

Changing these paths here without changing the website (or vice versa) breaks
the integration. Treat them as a contract.

## How the website learns about changes

The website already supports:

- **Realtime** on `books` and `book_pages`.
- A **60-second poll** plus **refresh on window focus** (`BookProvider`).
- Read endpoints `/api/book` and `/api/book/preview-pdf`.

> **Fixed in 0.1.1:** the website's browser Supabase client was silently `null`
> because `bookproject/lib/supabase/config.ts` read `NEXT_PUBLIC_*` through a
> dynamic `process.env[name]`, which Next.js does not inline into client code.
> That meant the Realtime subscription never connected (only the poll/focus
> fallback worked). The website config now uses static public-env access, so
> price/content edits propagate live. If live updates still do not appear,
> confirm `books`/`book_pages` are added to the `supabase_realtime` publication
> in Supabase (Database → Replication).

The dashboard therefore only needs to make correct database/storage changes:

- Editing a book updates the row (and `updated_at` via trigger).
- Publishing/unpublishing flips `is_published`.
- Page add/replace/delete/reorder updates `book_pages`.
- Touching `books.updated_at` (`touchBook`) nudges the website to refresh.

## PDF replacement & preview cache

The website caches a trimmed `preview.pdf`. When the dashboard replaces
`book.pdf`, it **deletes `preview.pdf`** so the website regenerates it from the
new source. It also touches `books.updated_at`. Finalization verifies the new
object exists before switching the database pointer.

## Safety

- The dashboard never makes the bucket public and never exposes `book.pdf`.
- Unpublished books are not shown to visitors.
- If a future website change is needed for cache-busting (e.g. a
  `&v=<updated_at>` query param on `pdfUrl`), keep it minimal and additive, and
  verify it in the browser.
