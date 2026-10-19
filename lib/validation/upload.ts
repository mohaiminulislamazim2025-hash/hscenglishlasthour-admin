import { z } from "zod";

export const UPLOAD_KINDS = ["cover", "pdf", "page"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

/** Server-side upload policy, aligned with the `book-assets` bucket config
 *  (file_size_limit 50 MiB; allowed_mime_types pdf/jpeg/png/webp). Images use a
 *  stricter 15 MiB app-side cap. */
export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MiB
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MiB

export const PDF_MIME = ["application/pdf"] as const;
export const IMAGE_MIME = [
  "image/webp",
  "image/jpeg",
  "image/png",
] as const;

export const ALLOWED_EXTENSIONS: Record<UploadKind, readonly string[]> = {
  cover: ["webp", "jpg", "jpeg", "png"],
  pdf: ["pdf"],
  page: ["webp", "jpg", "jpeg", "png"],
};

export const signUploadSchema = z.object({
  bookId: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "Invalid book id."),
  kind: z.enum(UPLOAD_KINDS),
  filename: z.string().trim().min(1).max(300),
  contentType: z.string().trim().min(1).max(150),
  size: z.coerce.number().int().positive("File appears to be empty."),
  pageNumber: z.coerce.number().int().positive().max(100000).optional(),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;

export interface UploadValidationResult {
  ok: boolean;
  message?: string;
}

/** Validate declared upload metadata against the per-kind policy. */
export function validateUploadMeta(input: SignUploadInput): UploadValidationResult {
  const ext = input.filename.split(".").pop()?.toLowerCase() ?? "";
  const allowedExt = ALLOWED_EXTENSIONS[input.kind];
  const allowedMime: readonly string[] = input.kind === "pdf" ? PDF_MIME : IMAGE_MIME;
  const maxBytes = input.kind === "pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;

  if (!allowedExt.includes(ext)) {
    return { ok: false, message: `Unsupported file type .${ext || "?"} for ${input.kind}.` };
  }
  if (!allowedMime.includes(input.contentType)) {
    return { ok: false, message: `Unsupported content type ${input.contentType}.` };
  }
  if (input.size > maxBytes) {
    return {
      ok: false,
      message: `File is too large. Maximum ${Math.round(maxBytes / (1024 * 1024))} MB.`,
    };
  }
  if (input.kind === "page" && !input.pageNumber) {
    return { ok: false, message: "A page number is required for page uploads." };
  }
  return { ok: true };
}
