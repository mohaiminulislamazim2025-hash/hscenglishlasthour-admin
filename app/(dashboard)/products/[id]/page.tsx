import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { IconImage, IconTrash } from "@/components/ui/icons";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductImageUploader } from "@/components/products/ProductImageUploader";
import { getProduct } from "@/lib/products/repository";
import { deleteProductAction } from "@/lib/products/actions";
import { createSignedUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";

const IMAGE_ACCEPT = "image/webp,image/jpeg,image/png,image/avif";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const product = await getProduct(id);
  if (!product) notFound();

  const imageUrl = product.imagePath ? await createSignedUrl(product.imagePath) : null;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={product.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge tone={product.isAvailable ? "published" : "draft"}>
              {product.isAvailable ? "Available" : "Unavailable"}
            </Badge>
            <span className="text-xs text-[var(--color-ink-muted)]">{product.id}</span>
          </span>
        }
        backHref="/products"
        backLabel="Back to products"
      />

      {error === "orders" ? (
        <Alert tone="warning" className="mb-4">
          This product cannot be deleted because existing orders reference it.
        </Alert>
      ) : null}
      {error === "delete" ? (
        <Alert tone="danger" className="mb-4">
          The product could not be deleted. Please try again.
        </Alert>
      ) : null}

      <Card className="mb-5">
        <CardHeader title="Product image" description="Shown on the storefront." />
        <div className="flex gap-4">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-white/4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt={`${product.name} image`} className="h-full w-full object-cover" />
            ) : (
              <IconImage width={22} height={22} className="text-[var(--color-ink-muted)]" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="text-xs text-[var(--color-ink-muted)]">
              {product.imagePath ? (
                <span className="break-all">Stored as {product.imagePath}</span>
              ) : (
                "No image uploaded yet."
              )}
            </div>
            <ProductImageUploader
              productId={product.id}
              accept={IMAGE_ACCEPT}
              label={product.imagePath ? "Replace image" : "Upload image"}
              successMessage="Image updated."
              variant="primary"
            />
          </div>
        </div>
      </Card>

      <ProductForm product={product} />

      <Card className="mt-5 border-rose-400/20">
        <CardHeader
          title="Danger zone"
          description="Deleting a product also removes its uploaded image from storage. This cannot be undone."
        />
        <ConfirmForm
          action={deleteProductAction}
          fields={[{ name: "id", value: product.id }]}
          title={`Delete "${product.name}"?`}
          description="This permanently removes the product. Items referenced by orders cannot be deleted."
          confirmLabel="Delete product"
          triggerClassName="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 h-10 text-sm font-semibold text-white hover:bg-rose-500 transition"
          trigger={
            <>
              <IconTrash width={16} height={16} />
              Delete product
            </>
          }
        />
      </Card>
    </div>
  );
}
