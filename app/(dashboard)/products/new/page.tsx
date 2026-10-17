import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/products/ProductForm";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add product"
        description="Create a catalog entry. Upload its image on the next screen."
        backHref="/products"
        backLabel="Back to products"
      />
      <ProductForm />
    </div>
  );
}
