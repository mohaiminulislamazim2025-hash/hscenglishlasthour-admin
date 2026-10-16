import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { AssetUploader } from "@/components/books/AssetUploader";
import { ReorderButtons } from "@/components/books/ReorderButtons";
import { IconEye, IconEyeOff, IconFile, IconImage, IconTrash } from "@/components/ui/icons";
import { getBook, getPages } from "@/lib/books/repository";
import {
  createSignedUrl,
  createSignedUrls,
  statObject,
} from "@/lib/supabase/storage";
import {
  deletePageFormAction,
  setPageAvailabilityFormAction,
} from "@/lib/books/actions";
import { MAX_IMAGE_BYTES, MAX_PDF_BYTES } from "@/lib/validation/upload";
import { formatBytes, formatDateTime } from "@/lib/format";
import { buildCoverPath, buildPdfPath } from "@/lib/storage/paths";

export const dynamic = "force-dynamic";

const IMAGE_ACCEPT = "image/webp,image/jpeg,image/png";

export default async function BookContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  const pages = await getPages(book.id);
  const orderedIds = pages.map((page) => page.id);

  const [coverUrl, pdfUrl, pdfStat, pageUrls] = await Promise.all([
    book.coverImagePath ? createSignedUrl(book.coverImagePath) : Promise.resolve(null),
    book.pdfStoragePath ? createSignedUrl(book.pdfStoragePath, 60 * 10) : Promise.resolve(null),
    book.pdfStoragePath ? statObject(book.pdfStoragePath) : Promise.resolve(null),
    createSignedUrls(pages.map((page) => page.storagePath)),
  ]);

  const nextPageNumber = pages.reduce((max, page) => Math.max(max, page.pageNumber), 0) + 1;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Content"
        description={`${book.title} · ${book.contentMode} mode · ${pages.length} page${pages.length === 1 ? "" : "s"}`}
        backHref={`/books/${book.id}`}
        backLabel="Back to book"
      />

      {book.contentMode === "pdf" ? (
        <Alert tone="info" className="mb-5">
          This book uses <strong>PDF</strong> content mode, so the website reads{" "}
          <code>book.pdf</code>. Page images below are optional and only used by the flip reader.
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cover image" description="Shown on the catalog and product page." />
          <div className="flex gap-4">
            <div className="flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/4">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt={`${book.title} cover`} className="h-full w-full object-cover" />
              ) : (
                <IconImage width={22} height={22} className="text-[var(--color-ink-muted)]" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div className="text-xs text-[var(--color-ink-muted)]">
                {book.coverImagePath ? (
                  <span className="break-all">
                    Stored as <code>{buildCoverPath(book.id, "…")}</code>
                  </span>
                ) : (
                  "No cover uploaded yet."
                )}
              </div>
              <AssetUploader
                bookId={book.id}
                kind="cover"
                accept={IMAGE_ACCEPT}
                maxBytes={MAX_IMAGE_BYTES}
                label={book.coverImagePath ? "Replace cover" : "Upload cover"}
                successMessage="Cover updated."
                variant="primary"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Full PDF" description="Private source file. Never served publicly." />
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/6 text-[var(--color-ink-soft)]">
                <IconFile width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                {book.pdfStoragePath ? (
                  <>
                    <p className="truncate text-sm text-[var(--color-ink)]">{buildPdfPath(book.id)}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {formatBytes(pdfStat?.size ?? null)}
                      {pdfStat?.updatedAt ? ` · updated ${formatDateTime(pdfStat.updatedAt)}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-ink-muted)]">No PDF uploaded yet.</p>
                )}
              </div>
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/8 px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-white/8"
                >
                  Preview
                </a>
              ) : null}
            </div>
            <AssetUploader
              bookId={book.id}
              kind="pdf"
              accept="application/pdf"
              maxBytes={MAX_PDF_BYTES}
              label={book.pdfStoragePath ? "Replace PDF" : "Upload PDF"}
              successMessage="PDF saved. The website will regenerate its preview."
              variant="primary"
            />
            <p className="text-xs text-[var(--color-ink-muted)]">
              Replacing the PDF clears the website&apos;s cached preview so it is rebuilt from the new
              file. Maximum {Math.round(MAX_PDF_BYTES / (1024 * 1024))} MB.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Pages"
          description="Individual page images used by the flip reader, in display order."
          action={
            <AssetUploader
              bookId={book.id}
              kind="page"
              pageNumber={nextPageNumber}
              accept={IMAGE_ACCEPT}
              maxBytes={MAX_IMAGE_BYTES}
              label="Add page"
              successMessage={`Page ${nextPageNumber} added.`}
              variant="secondary"
            />
          }
        />

        {pages.length === 0 ? (
          <EmptyState
            title="No pages yet"
            description="Upload page images in order. Each page is numbered automatically; you can reorder them afterwards."
            icon={<IconImage />}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pages.map((page, index) => {
              const url = pageUrls[page.storagePath] ?? null;
              return (
                <div
                  key={page.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-white/8 bg-white/4"
                >
                  <div className="relative aspect-[1/1.4] w-full bg-black/20">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={page.alt ?? `Page ${page.pageNumber}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-ink-muted)]">
                        <IconImage width={20} height={20} />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      #{page.pageNumber}
                    </span>
                    <span className="absolute right-2 top-2">
                      <Badge tone={page.isAvailable ? "published" : "draft"}>
                        {page.isAvailable ? "Live" : "Hidden"}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <ReorderButtons bookId={book.id} orderedIds={orderedIds} index={index} />
                      <div className="flex items-center gap-1">
                        <form action={setPageAvailabilityFormAction}>
                          <input type="hidden" name="bookId" value={book.id} />
                          <input type="hidden" name="pageId" value={page.id} />
                          <input type="hidden" name="available" value={page.isAvailable ? "false" : "true"} />
                          <SubmitButton
                            variant="ghost"
                            size="sm"
                            pendingLabel="…"
                            title={page.isAvailable ? "Hide page" : "Show page"}
                          >
                            {page.isAvailable ? (
                              <IconEyeOff width={14} height={14} />
                            ) : (
                              <IconEye width={14} height={14} />
                            )}
                          </SubmitButton>
                        </form>
                        <ConfirmForm
                          action={deletePageFormAction}
                          fields={[
                            { name: "bookId", value: book.id },
                            { name: "pageId", value: page.id },
                          ]}
                          title={`Delete page ${page.pageNumber}?`}
                          description="This removes the page image from storage and the reader."
                          confirmLabel="Delete page"
                          triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-300 transition hover:bg-rose-500/15"
                          trigger={<IconTrash width={14} height={14} />}
                        />
                      </div>
                    </div>
                    <AssetUploader
                      bookId={book.id}
                      kind="page"
                      pageNumber={page.pageNumber}
                      pageId={page.id}
                      accept={IMAGE_ACCEPT}
                      maxBytes={MAX_IMAGE_BYTES}
                      label="Replace image"
                      successMessage="Page image replaced."
                      variant="ghost"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
