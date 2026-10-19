import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { LinkButton } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { IconBook, IconEye, IconEyeOff, IconImage, IconPencil, IconPlus } from "@/components/ui/icons";
import { listBooks } from "@/lib/books/repository";
import { createSignedUrls } from "@/lib/supabase/storage";
import { setPublishedAction } from "@/lib/books/actions";
import { formatDate, formatMoney } from "@/lib/format";
import { titleCase } from "@/components/ui/utils";
import type { BookSummary } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const books = await listBooks();
  const coverUrls = await createSignedUrls(
    books.map((book) => book.coverImagePath).filter((path): path is string => Boolean(path)),
  );

  const deleted = params.deleted === "1";

  return (
    <div>
      <PageHeader
        title="Books"
        description="Manage the catalog served to the public website."
        action={
          <LinkButton href="/books/new" size="md">
            <IconPlus width={16} height={16} />
            Add book
          </LinkButton>
        }
      />

      {deleted ? (
        <Alert tone="success" className="mb-4">
          Book deleted.
        </Alert>
      ) : null}

      {books.length === 0 ? (
        <EmptyState
          title="No books yet"
          description="Create your first book to manage its content, pricing and publication."
          icon={<IconBook />}
          action={
            <LinkButton href="/books/new" size="sm">
              <IconPlus width={14} height={14} />
              Add book
            </LinkButton>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs text-[var(--color-ink-muted)]">
                  <th className="px-5 py-3 font-medium">Book</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Pages</th>
                  <th className="px-3 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {books.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    coverUrl={book.coverImagePath ? coverUrls[book.coverImagePath] ?? null : null}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function BookRow({ book, coverUrl }: { book: BookSummary; coverUrl: string | null }) {
  const price = book.offerPrice ?? book.price;
  return (
    <tr className="align-middle transition hover:bg-white/4">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/8 bg-white/4">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <IconImage width={16} height={16} className="text-[var(--color-ink-muted)]" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/books/${book.id}`}
              className="line-clamp-1 font-medium text-[var(--color-ink)] hover:text-[var(--color-brand-soft)]"
            >
              {book.title}
            </Link>
            <p className="truncate text-xs text-[var(--color-ink-muted)]">
              {book.id} · {book.contentMode}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <Badge tone={book.isPublished ? "published" : "draft"}>
          {book.isPublished ? "Published" : "Draft"}
        </Badge>
      </td>
      <td className="px-3 py-3 tabular-nums">
        {formatMoney(price, book.currency)}
        {book.offerPrice !== null && book.offerPrice < book.price ? (
          <span className="ml-1 text-xs text-[var(--color-ink-muted)] line-through">
            {formatMoney(book.price, book.currency)}
          </span>
        ) : null}
      </td>
      <td className="px-3 py-3 tabular-nums text-[var(--color-ink-soft)]">{book.pageCount ?? 0}</td>
      <td className="px-3 py-3 text-xs text-[var(--color-ink-muted)]">{formatDate(book.updatedAt)}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <LinkButton href={`/books/${book.id}`} variant="ghost" size="sm" title="Edit details">
            <IconPencil width={15} height={15} />
            Edit
          </LinkButton>
          <LinkButton
            href={`/books/${book.id}/content`}
            variant="ghost"
            size="sm"
            title={`Manage ${titleCase(book.contentMode)} content`}
          >
            <IconImage width={15} height={15} />
            Content
          </LinkButton>
          <form action={setPublishedAction}>
            <input type="hidden" name="id" value={book.id} />
            <input type="hidden" name="published" value={book.isPublished ? "false" : "true"} />
            <SubmitButton
              variant="secondary"
              size="sm"
              pendingLabel="Saving…"
              title={book.isPublished ? "Unpublish" : "Publish"}
            >
              {book.isPublished ? (
                <>
                  <IconEyeOff width={15} height={15} />
                  Unpublish
                </>
              ) : (
                <>
                  <IconEye width={15} height={15} />
                  Publish
                </>
              )}
            </SubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}
