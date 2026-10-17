import "server-only";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import { productExists } from "@/lib/products/repository";
import { getSupabaseProductBucket } from "@/lib/supabase/config";
import { signUploadSchema, validateUploadMeta } from "@/lib/validation/upload";
import { buildProductImagePath, extensionFromFilename } from "@/lib/storage/paths";

export const dynamic = "force-dynamic";

/**
 * Issue a short-lived signed upload URL for the product-images bucket. The
 * browser uploads directly to Storage, so the secret key and large request
 * bodies never pass through Next.js. Admin-only (deny by default).
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = signUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid upload request." },
      { status: 400 },
    );
  }

  const meta = validateUploadMeta(parsed.data);
  if (!meta.ok) {
    return NextResponse.json({ error: meta.message ?? "Upload rejected." }, { status: 400 });
  }

  if (!(await productExists(parsed.data.productId))) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const ext = extensionFromFilename(parsed.data.filename, "webp");
  const path = buildProductImagePath(parsed.data.productId, ext);

  const signed = await createSignedUploadUrl(path);
  if (!signed) {
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 502 });
  }

  return NextResponse.json({
    path: signed.path,
    token: signed.token,
    bucket: getSupabaseProductBucket(),
  });
}
