import { describe, expect, it } from "vitest";
import {
  MAX_IMAGE_BYTES,
  signUploadSchema,
  validateUploadMeta,
} from "@/lib/validation/upload";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

const meta = (overrides: Record<string, unknown> = {}) => ({
  productId: UUID,
  filename: "product.webp",
  contentType: "image/webp",
  size: 1024,
  ...overrides,
});

describe("upload sign schema", () => {
  it("accepts a valid image upload request", () => {
    const parsed = signUploadSchema.parse(meta({ size: "2048" }));
    expect(parsed.productId).toBe(UUID);
    expect(parsed.size).toBe(2048);
  });

  it("requires a UUID product id", () => {
    expect(signUploadSchema.safeParse(meta({ productId: "not-a-uuid" })).success).toBe(false);
  });

  it("rejects empty or zero-byte files", () => {
    expect(signUploadSchema.safeParse(meta({ size: 0 })).success).toBe(false);
    expect(signUploadSchema.safeParse(meta({ size: -5 })).success).toBe(false);
  });
});

describe("upload metadata validation", () => {
  it("accepts allowed image types", () => {
    expect(validateUploadMeta(signUploadSchema.parse(meta())).ok).toBe(true);
    expect(
      validateUploadMeta(signUploadSchema.parse(meta({ filename: "a.png", contentType: "image/png" }))).ok,
    ).toBe(true);
    expect(
      validateUploadMeta(signUploadSchema.parse(meta({ filename: "a.avif", contentType: "image/avif" }))).ok,
    ).toBe(true);
  });

  it("rejects disallowed extensions", () => {
    const result = validateUploadMeta(signUploadSchema.parse(meta({ filename: "book.pdf" })));
    expect(result.ok).toBe(false);
  });

  it("rejects disallowed content types", () => {
    const result = validateUploadMeta(
      signUploadSchema.parse(meta({ filename: "a.gif", contentType: "image/gif" })),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects files larger than the image limit", () => {
    const result = validateUploadMeta(signUploadSchema.parse(meta({ size: MAX_IMAGE_BYTES + 1 })));
    expect(result.ok).toBe(false);
    expect(result.message).toContain("too large");
  });

  it("allows a file exactly at the limit", () => {
    expect(validateUploadMeta(signUploadSchema.parse(meta({ size: MAX_IMAGE_BYTES }))).ok).toBe(true);
  });
});
