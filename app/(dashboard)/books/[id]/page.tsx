import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/feedback";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { IconImage, IconTrash } from "@/components/ui/icons";
import { BookForm } from "@/components/books/BookForm";
import { getBook } from "@/lib/books/repository";
import { deleteBookAction } from "@/lib/books/actions";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const book = await getBook(id);
  if (!book) notFound();

  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={book.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={book.isPublished ? "published" : "draft"}>
              {book.isPublished ? "Published" : "Draft"}
            </Badge>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {book.id} · {book.pageCount ?? 0} pages
            </span>
          </span>
        }
        backHref="/books"
        backLabel="Back to books"
        action={
          <LinkButton href={`/books/${book.id}/content`} variant="secondary" size="md">
            <IconImage width={16} height={16} />
            Manage content
          </LinkButton>
        }
      />

      {error === "orders" ? (
        <Alert tone="warning" className="mb-4">
          This book cannot be deleted because existing orders reference it. Unpublish it instead to
          hide it from the website.
        </Alert>
      ) : null}
      {error === "delete" ? (
        <Alert tone="danger" className="mb-4">
          The book could not be deleted. Please try again.
        </Alert>
      ) : null}

      <BookForm book={book} />

      <Card className="mt-5 border-rose-400/20">
        <CardHeader
          title="Danger zone"
          description="Deleting a book also removes its cover, PDF and page images from storage. This cannot be undone."
        />
        <ConfirmForm
          action={deleteBookAction}
          fields={[{ name: "id", value: book.id }]}
          title={`Delete "${book.title}"?`}
          description="This permanently removes the catalog entry and its uploaded assets. Books referenced by orders cannot be deleted."
          confirmLabel="Delete book"
          triggerClassName="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 h-10 text-sm font-semibold text-white hover:bg-rose-500 transition"
          trigger={
            <>
              <IconTrash width={16} height={16} />
              Delete book
            </>
          }
        />
      </Card>
    </div>
  );
}
