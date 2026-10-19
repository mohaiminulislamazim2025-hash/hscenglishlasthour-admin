import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/feedback";
import { IconBook, IconImage } from "@/components/ui/icons";
import { listBooks } from "@/lib/books/repository";
import { createSignedUrls, statObject } from "@/lib/supabase/storage";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContentIndexPage() {
  const books = await listBooks();
  const [covers, pdfStats] = await Promise.all([
    createSignedUrls(books.map((b) => b.coverImagePath).filter((p): p is string => Boolean(p))),
    Promise.all(
      books.map(async (book) =>
        book.pdfStoragePath ? await statObject(book.pdfStoragePath) : null,
      ),
    ),
  ]);

  return (
    <div>
      <PageHeader
        title="Content / PDF & Images"
        description="Manage the cover, PDF and page images for each book."
      />

      {books.length === 0 ? (
        <EmptyState
          title="No books yet"
          description="Create a book first, then upload its content here."
          icon={<IconBook />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book, index) => {
            const coverUrl = book.coverImagePath ? covers[book.coverImagePath] ?? null : null;
            const pdfStat = pdfStats[index];
            return (
              <Card key={book.id} className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/8 bg-white/4">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <IconImage width={18} height={18} className="text-[var(--color-ink-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[var(--color-ink)]">
                      {book.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                      {book.id} · {book.contentMode}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={book.coverImagePath ? "published" : "draft"}>
                        {book.coverImagePath ? "Cover" : "No cover"}
                      </Badge>
                      <Badge tone={book.pdfStoragePath ? "published" : "draft"}>
                        {book.pdfStoragePath ? "PDF" : "No PDF"}
                      </Badge>
                      <Badge tone="draft">{book.pageCount ?? 0} pages</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-[var(--color-ink-muted)]">
                  {pdfStat?.updatedAt ? <p>PDF updated {formatDate(pdfStat.updatedAt)}</p> : null}
                  <p>Updated {formatDate(book.updatedAt)}</p>
                </div>

                <Link
                  href={`/books/${book.id}/content`}
                  className="mt-auto inline-flex h-9 items-center justify-center rounded-xl border border-white/8 text-sm font-medium text-[var(--color-ink)] transition hover:bg-white/8"
                >
                  Manage content
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
