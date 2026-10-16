import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  signUploadSchema,
  validateUploadMeta,
  type SignUploadInput,
} from "@/lib/validation/upload";

function meta(overrides: Partial<SignUploadInput>): SignUploadInput {
  return {
    bookId: "hscenglishlasthour",
    kind: "cover",
    filename: "cover.webp",
    contentType: "image/webp",
    size: 1024,
    ...overrides,
  };
}

describe("validateUploadMeta", () => {
  it("accepts a valid cover image", () => {
    expect(validateUploadMeta(meta({})).ok).toBe(true);
  });

  it("accepts a valid pdf within limits", () => {
    const result = validateUploadMeta(
      meta({ kind: "pdf", filename: "book.pdf", contentType: "application/pdf", size: MAX_PDF_BYTES }),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects oversized pdfs", () => {
    const result = validateUploadMeta(
      meta({ kind: "pdf", filename: "book.pdf", contentType: "application/pdf", size: MAX_PDF_BYTES + 1 }),
    );
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/too large/i);
  });

  it("rejects oversized images", () => {
    const result = validateUploadMeta(meta({ size: MAX_IMAGE_BYTES + 1 }));
    expect(result.ok).toBe(false);
  });

  it("rejects mismatched extensions", () => {
    expect(validateUploadMeta(meta({ filename: "cover.exe" })).ok).toBe(false);
    expect(validateUploadMeta(meta({ kind: "pdf", filename: "cover.png", contentType: "application/pdf" })).ok).toBe(false);
  });

  it("rejects mismatched content types", () => {
    expect(validateUploadMeta(meta({ contentType: "application/pdf" })).ok).toBe(false);
  });

  it("rejects image types the bucket does not allow (gif/avif)", () => {
    expect(validateUploadMeta(meta({ filename: "cover.gif", contentType: "image/gif" })).ok).toBe(false);
    expect(validateUploadMeta(meta({ filename: "cover.avif", contentType: "image/avif" })).ok).toBe(false);
  });

  it("requires a page number for page uploads", () => {
    const noPage = validateUploadMeta(meta({ kind: "page", filename: "001.webp" }));
    expect(noPage.ok).toBe(false);
    const withPage = validateUploadMeta(meta({ kind: "page", filename: "001.webp", pageNumber: 1 }));
    expect(withPage.ok).toBe(true);
  });
});

describe("signUploadSchema", () => {
  it("parses a valid payload", () => {
    const parsed = signUploadSchema.parse({
      bookId: "b1",
      kind: "page",
      filename: "001.png",
      contentType: "image/png",
      size: "2048",
      pageNumber: "3",
    });
    expect(parsed.size).toBe(2048);
    expect(parsed.pageNumber).toBe(3);
  });

  it("rejects invalid book ids", () => {
    expect(() =>
      signUploadSchema.parse(meta({ bookId: "Bad ID!" })),
    ).toThrow();
  });

  it("rejects an unknown kind", () => {
    expect(() => signUploadSchema.parse({ ...meta({}), kind: "avatar" })).toThrow();
  });
});
