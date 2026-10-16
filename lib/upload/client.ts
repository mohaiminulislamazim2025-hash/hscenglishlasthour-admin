"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { publicConfigDiagnostic } from "@/lib/supabase/config";
import type { UploadKind } from "@/lib/validation/upload";

export interface SignResponse {
  path: string;
  token: string;
  bucket: string;
}

export interface SignedUploadRequest {
  bookId: string;
  kind: UploadKind;
  filename: string;
  contentType: string;
  size: number;
  pageNumber?: number;
}

/** Ask the server to mint a short-lived signed upload URL for a book asset. */
export async function requestSignedUpload(input: SignedUploadRequest): Promise<SignResponse> {
  const response = await fetch("/api/admin/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await response.json().catch(() => null)) as (SignResponse & { error?: string }) | null;
  if (!response.ok || !data?.path || !data.token) {
    throw new Error(data?.error ?? "Could not prepare the upload.");
  }
  return { path: data.path, token: data.token, bucket: data.bucket };
}

/** Upload a file directly to private Storage using the signed token. */
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

/** Extract a lowercase extension, or empty string. */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}
