"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { publicConfigDiagnostic } from "@/lib/supabase/config";

export interface SignResponse {
  path: string;
  token: string;
  bucket: string;
}

export interface SignedUploadRequest {
  productId: string;
  filename: string;
  contentType: string;
  size: number;
}

export async function requestSignedUpload(input: SignedUploadRequest): Promise<SignResponse> {
  const response = await fetch("/api/admin/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: input.productId,
      filename: input.filename,
      contentType: input.contentType,
      size: input.size,
    }),
  });
  const data = (await response.json().catch(() => null)) as (SignResponse & { error?: string }) | null;
  if (!response.ok || !data?.path || !data.token) {
    throw new Error(data?.error ?? "Could not prepare the upload.");
  }
  return { path: data.path, token: data.token, bucket: data.bucket };
}

export async function uploadFileToStorage(sign: SignResponse, file: File): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error(publicConfigDiagnostic());
  const { error } = await supabase.storage
    .from(sign.bucket)
    .uploadToSignedUrl(sign.path, sign.token, file, {
      contentType: file.type || undefined,
      upsert: true,
    });
  if (error) throw new Error(error.message);
}
