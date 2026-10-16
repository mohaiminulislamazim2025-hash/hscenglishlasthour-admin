import "server-only";

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { createSignedUploadUrl } from "@/lib/supabase/storage";
import { bookExists } from "@/lib/books/repository";
import { getSupabaseBookBucket } from "@/lib/supabase/config";
import { signUploadSchema, validateUploadMeta } from "@/lib/validation/upload";
import { buildCoverPath, buildPagePath, buildPdfPath, extensionFromFilename } from "@/lib/storage/paths";

export const dynamic = "force-dynamic";

/**
 * Issue a short-lived signed upload URL for the private `book-assets` bucket.
 * The browser uploads directly to Storage, so the service-role key and large
 * request bodies never pass through Next.js. Admin-only (deny by default).
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

  if (!(await bookExists(parsed.data.bookId))) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }

  const ext = extensionFromFilename(parsed.data.filename, parsed.data.kind === "pdf" ? "pdf" : "bin");
  const path =
    parsed.data.kind === "cover"
      ? buildCoverPath(parsed.data.bookId, ext)
      : parsed.data.kind === "pdf"
        ? buildPdfPath(parsed.data.bookId)
        : buildPagePath(parsed.data.bookId, parsed.data.pageNumber ?? 1, ext);

  const signed = await createSignedUploadUrl(path);
  if (!signed) {
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 502 });
  }

  return NextResponse.json({
    path: signed.path,
    token: signed.token,
    bucket: getSupabaseBookBucket(),
  });
}
