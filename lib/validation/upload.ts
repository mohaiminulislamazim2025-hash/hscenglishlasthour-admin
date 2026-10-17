import { z } from "zod";

export const UPLOAD_KINDS = ["image"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const IMAGE_MIME = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/avif",
] as const;

export const ALLOWED_EXTENSIONS: Record<UploadKind, readonly string[]> = {
  image: ["webp", "jpg", "jpeg", "png", "avif"],
};

export const signUploadSchema = z.object({
  productId: z.string().uuid("Invalid product id."),
  filename: z.string().trim().min(1).max(300),
  contentType: z.string().trim().min(1).max(150),
  size: z.coerce.number().int().positive("File appears to be empty."),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;

export interface UploadValidationResult {
  ok: boolean;
  message?: string;
}

export function validateUploadMeta(input: SignUploadInput): UploadValidationResult {
  const ext = input.filename.split(".").pop()?.toLowerCase() ?? "";
  const allowedExt = ALLOWED_EXTENSIONS.image;
  const allowedMime: readonly string[] = IMAGE_MIME;

  if (!allowedExt.includes(ext)) {
    return { ok: false, message: `Unsupported file type .${ext || "?"} for image.` };
  }
  if (!allowedMime.includes(input.contentType)) {
    return { ok: false, message: `Unsupported content type ${input.contentType}.` };
  }
  if (input.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      message: `File is too large. Maximum ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
    };
  }
  return { ok: true };
}
