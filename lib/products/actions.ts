"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAction, AuthorizationError } from "@/lib/auth/dal";
import {
  createProduct,
  getProduct,
  productExists,
  setAvailability,
  setProductImagePath,
  touchProduct,
  updateProduct,
} from "./repository";
import { productCreateSchema, productUpdateSchema, formToProductObject } from "@/lib/validation/product";
import { objectExists, removeObjects } from "@/lib/supabase/storage";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export interface ProductFormState {
  ok?: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function zodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function createProductAction(
  _prev: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }

  const parsed = productCreateSchema.safeParse(formToProductObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const product = await createProduct(parsed.data);
    revalidatePath("/products");
    revalidatePath("/");
    redirect(`/products/${product.id}`);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not create the product." };
  }
}

export async function updateProductAction(
  _prev: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id || !(await productExists(id))) {
    return { ok: false, message: "Product not found." };
  }

  const parsed = productUpdateSchema.safeParse(formToProductObject(formData));
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    await updateProduct(id, parsed.data);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not update the product." };
  }

  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true, message: "Product saved." };
}

async function guard(): Promise<void> {
  await requireAdminAction();
}

export async function setAvailabilityAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  const available = String(formData.get("published") ?? "") === "true" || String(formData.get("available") ?? "") === "true";
  if (!id) return;
  await setAvailability(id, available);
  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const product = await getProduct(id);
  if (!product) return;

  const { getSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const { error } = await getSupabaseAdminClient().from("products").delete().eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23503") {
      redirect(`/products/${id}?error=orders`);
    }
    redirect(`/products/${id}?error=delete`);
  }

  await removeObjects(product.imagePath ? [product.imagePath] : []);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products?deleted=1");
}

export async function finalizeProductImageUploadAction(payload: {
  productId: string;
  path: string;
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
  const { productId, path } = payload;
  if (!productId || !path || !(await productExists(productId))) return actionError("Product not found.");
  if (!path.startsWith(`products/${productId}/image.`)) return actionError("Unexpected image path.");
  if (!(await objectExists(path))) return actionError("Upload did not complete. Try again.");

  const previous = (await getProduct(productId))?.imagePath;
  await setProductImagePath(productId, path);
  if (previous && previous !== path) await removeObjects([previous]);

  await touchProduct(productId);
  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return actionSuccess("Image updated.");
}
