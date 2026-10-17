"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/Card";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { createProductAction, updateProductAction, type ProductFormState } from "@/lib/products/actions";
import type { ProductSummary } from "@/types/admin";

export function ProductForm({ product }: { product?: ProductSummary }) {
  const isEdit = Boolean(product);
  const [state, action] = useActionState<ProductFormState | undefined, FormData>(
    isEdit ? updateProductAction : createProductAction,
    undefined,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      {isEdit ? <input type="hidden" name="id" value={product!.id} /> : null}

      {state?.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}

      <Card>
        <CardHeader title="Product details" description="Shown on the storefront." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" defaultValue={product?.name ?? ""} required />
          </Field>
          <Field label="Price (BDT)" htmlFor="priceBdt" error={errors.priceBdt}>
            <Input id="priceBdt" name="priceBdt" type="number" min="0" step="0.01" defaultValue={product?.priceBdt ?? 0} required />
          </Field>
          <Field label="Stock quantity" htmlFor="stockQuantity" error={errors.stockQuantity}>
            <Input id="stockQuantity" name="stockQuantity" type="number" min="0" step="1" defaultValue={product?.stockQuantity ?? 0} required />
          </Field>
          <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
            <Input id="sortOrder" name="sortOrder" type="number" min="0" step="1" defaultValue={product?.sortOrder ?? 0} />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description} hint="Optional" className="sm:col-span-2">
            <Textarea id="description" name="description" defaultValue={product?.description ?? ""} />
          </Field>
          <Checkbox
            name="isAvailable"
            label="Available for sale"
            description="Visible to website visitors"
            defaultChecked={product?.isAvailable ?? true}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Link href={isEdit ? `/products/${product!.id}` : "/products"}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
        <SubmitButton pendingLabel="Saving…" size="lg">
          {isEdit ? "Save changes" : "Create product"}
        </SubmitButton>
      </div>
    </form>
  );
}
