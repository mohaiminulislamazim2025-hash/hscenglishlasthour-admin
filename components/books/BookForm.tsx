"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, Input, Select, Textarea, Checkbox } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { createBookAction, updateBookAction, type BookFormState } from "@/lib/books/actions";
import { CONTENT_MODES, READING_MODES, type BookSummary } from "@/types/admin";

export function BookForm({ book }: { book?: BookSummary }) {
  const isEdit = Boolean(book);
  const [state, action] = useActionState<BookFormState | undefined, FormData>(
    isEdit ? updateBookAction : createBookAction,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {isEdit ? <input type="hidden" name="id" value={book!.id} /> : null}

      {state?.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <Card>
        <CardHeader title="Identity" description="Core catalog information shown on the website." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Book id (slug)"
            htmlFor="id"
            hint={isEdit ? "The id is permanent and cannot be changed." : "Lowercase letters, numbers and hyphens, e.g. hscenglishlasthour"}
            error={errors.id}
            className={isEdit ? "sm:col-span-2" : ""}
          >
            <Input id="id" name="id" defaultValue={book?.id ?? ""} disabled={isEdit} required readOnly={isEdit} />
          </Field>
          {!isEdit ? <div className="hidden sm:block" /> : null}
          <Field label="Title" htmlFor="title" error={errors.title}>
            <Input id="title" name="title" defaultValue={book?.title ?? ""} required />
          </Field>
          <Field label="Author" htmlFor="author" error={errors.author} hint="Optional">
            <Input id="author" name="author" defaultValue={book?.author ?? ""} />
          </Field>
          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
            hint="Optional. Shown on the product page."
            className="sm:col-span-2"
          >
            <Textarea id="description" name="description" defaultValue={book?.description ?? ""} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Pricing" description="Amounts are stored exactly as entered." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Price" htmlFor="price" error={errors.price}>
            <Input id="price" name="price" type="number" min="0" step="0.01" defaultValue={book?.price ?? 0} required />
          </Field>
          <Field label="Offer price" htmlFor="offerPrice" error={errors.offerPrice} hint="Optional discounted price">
            <Input
              id="offerPrice"
              name="offerPrice"
              type="number"
              min="0"
              step="0.01"
              defaultValue={book?.offerPrice ?? ""}
            />
          </Field>
          <Field label="Delivery charge" htmlFor="deliveryCharge" error={errors.deliveryCharge}>
            <Input
              id="deliveryCharge"
              name="deliveryCharge"
              type="number"
              min="0"
              step="0.01"
              defaultValue={book?.deliveryCharge ?? 0}
              required
            />
          </Field>
          <Field label="Currency" htmlFor="currency" error={errors.currency}>
            <Input id="currency" name="currency" defaultValue={book?.currency ?? "BDT"} required />
          </Field>
          <Field label="Market country" htmlFor="marketCountry" error={errors.marketCountry}>
            <Input id="marketCountry" name="marketCountry" defaultValue={book?.marketCountry ?? "Bangladesh"} required />
          </Field>
          <Field label="Phone region" htmlFor="phoneRegion" error={errors.phoneRegion}>
            <Input id="phoneRegion" name="phoneRegion" defaultValue={book?.phoneRegion ?? "BD"} required />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Reading experience"
          description="Controls how visitors read the book and how much is previewable."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Content mode" htmlFor="contentMode" error={errors.contentMode}>
            <Select id="contentMode" name="contentMode" defaultValue={book?.contentMode ?? "page-images"}>
              {CONTENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default reading mode" htmlFor="defaultMode" error={errors.defaultMode}>
            <Select id="defaultMode" name="defaultMode" defaultValue={book?.defaultMode ?? "flip"}>
              {READING_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preview page count" htmlFor="previewPageCount" error={errors.previewPageCount} hint="Free pages before purchase">
            <Input
              id="previewPageCount"
              name="previewPageCount"
              type="number"
              min="0"
              step="1"
              defaultValue={book?.previewPageCount ?? 4}
              required
            />
          </Field>
          <Field label="Page aspect ratio" htmlFor="pageAspectRatio" error={errors.pageAspectRatio} hint="Width ÷ height, e.g. 1.4">
            <Input
              id="pageAspectRatio"
              name="pageAspectRatio"
              type="number"
              min="0.1"
              step="0.01"
              defaultValue={book?.pageAspectRatio ?? 1.4}
              required
            />
          </Field>
          <Field label="Min zoom" htmlFor="minZoom" error={errors.minZoom}>
            <Input id="minZoom" name="minZoom" type="number" min="0.1" step="0.05" defaultValue={book?.minZoom ?? 0.75} required />
          </Field>
          <Field label="Max zoom" htmlFor="maxZoom" error={errors.maxZoom}>
            <Input id="maxZoom" name="maxZoom" type="number" min="0.1" step="0.05" defaultValue={book?.maxZoom ?? 2.5} required />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Checkbox
            name="flipEnabled"
            label="Flip reading enabled"
            description="Allow page-by-page reading"
            defaultChecked={book?.flipEnabled ?? true}
          />
          <Checkbox
            name="pdfEnabled"
            label="PDF mode enabled"
            description="Allow the full PDF reader"
            defaultChecked={book?.pdfEnabled ?? true}
          />
          <Checkbox
            name="isPublished"
            label="Published"
            description="Visible to website visitors"
            defaultChecked={book?.isPublished ?? false}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link href={isEdit ? `/books/${book!.id}` : "/books"}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <SubmitButton pendingLabel="Saving…" size="lg">
          {isEdit ? "Save changes" : "Create book"}
        </SubmitButton>
      </div>
    </form>
  );
}
