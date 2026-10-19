import { PageHeader } from "@/components/layout/PageHeader";
import { BookForm } from "@/components/books/BookForm";

export const dynamic = "force-dynamic";

export default function NewBookPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add book"
        description="Create a catalog entry. Upload its cover, PDF and pages on the next screen."
        backHref="/books"
        backLabel="Back to books"
      />
      <BookForm />
    </div>
  );
}
