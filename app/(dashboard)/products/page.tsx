import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { LinkButton } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { IconShirt, IconEye, IconEyeOff, IconImage, IconPencil, IconPlus } from "@/components/ui/icons";
import { listProducts } from "@/lib/products/repository";
import { createSignedUrls } from "@/lib/supabase/storage";
import { setAvailabilityAction } from "@/lib/products/actions";
import { formatDate, formatMoney } from "@/lib/format";
import type { ProductSummary } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const products = await listProducts();
  const imageUrls = await createSignedUrls(
    products.map((p) => p.imagePath).filter((path): path is string => Boolean(path)),
  );
  const deleted = params.deleted === "1";

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the catalog served to the storefront."
        action={
          <LinkButton href="/products/new" size="md">
            <IconPlus width={16} height={16} />
            Add product
          </LinkButton>
        }
      />

      {deleted ? (
        <Alert tone="success" className="mb-4">
          Product deleted.
        </Alert>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product to manage pricing and availability."
          icon={<IconShirt />}
          action={
            <LinkButton href="/products/new" size="sm">
              <IconPlus width={14} height={14} />
              Add product
            </LinkButton>
          }
        />
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left text-xs text-[var(--color-ink-muted)]">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Price</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    imageUrl={product.imagePath ? imageUrls[product.imagePath] ?? null : null}
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

function ProductRow({ product, imageUrl }: { product: ProductSummary; imageUrl: string | null }) {
  return (
    <tr className="align-middle transition hover:bg-white/4">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/8 bg-white/4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <IconImage width={16} height={16} className="text-[var(--color-ink-muted)]" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={`/products/${product.id}`}
              className="line-clamp-1 font-medium text-[var(--color-ink)] hover:text-[var(--color-brand-soft)]"
            >
              {product.name}
            </Link>
            <p className="truncate text-xs text-[var(--color-ink-muted)]">{product.id}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <Badge tone={product.isAvailable ? "published" : "draft"}>
          {product.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </td>
      <td className="px-3 py-3 tabular-nums">{formatMoney(product.priceBdt, "BDT")}</td>
      <td className="px-3 py-3 tabular-nums text-[var(--color-ink-soft)]">{product.stockQuantity}</td>
      <td className="px-3 py-3 text-xs text-[var(--color-ink-muted)]">{formatDate(product.updatedAt)}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <LinkButton href={`/products/${product.id}`} variant="ghost" size="sm" title="Edit details">
            <IconPencil width={15} height={15} />
            Edit
          </LinkButton>
          <form action={setAvailabilityAction}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="available" value={product.isAvailable ? "false" : "true"} />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…" title={product.isAvailable ? "Mark unavailable" : "Mark available"}>
              {product.isAvailable ? (
                <>
                  <IconEyeOff width={15} height={15} />
                  Unavailable
                </>
              ) : (
                <>
                  <IconEye width={15} height={15} />
                  Available
                </>
              )}
            </SubmitButton>
          </form>
        </div>
      </td>
    </tr>
  );
}
