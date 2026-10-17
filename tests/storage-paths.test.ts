import { describe, expect, it } from "vitest";
import {
  buildProductImagePath,
  extensionFromFilename,
  isProductImagePath,
  normalizeExt,
  productFolder,
} from "@/lib/storage/paths";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("storage path conventions", () => {
  it("builds product image paths matching the storefront convention", () => {
    expect(buildProductImagePath(UUID)).toBe(`products/${UUID}/image.webp`);
    expect(buildProductImagePath(UUID, "png")).toBe(`products/${UUID}/image.png`);
  });

  it("builds the product folder path", () => {
    expect(productFolder(UUID)).toBe(`products/${UUID}`);
  });

  it("recognizes the canonical product image path", () => {
    expect(isProductImagePath(UUID, `products/${UUID}/image.webp`)).toBe(true);
    expect(isProductImagePath(UUID, `products/other/image.webp`)).toBe(false);
  });

  it("normalizes extensions", () => {
    expect(normalizeExt(".PNG")).toBe("png");
    expect(normalizeExt("jpeg")).toBe("jpeg");
  });

  it("derives a safe extension from filenames", () => {
    expect(extensionFromFilename("Shirt.PNG")).toBe("png");
    expect(extensionFromFilename("photo.webp?token=abc")).toBe("webp");
    expect(extensionFromFilename("no-extension")).toBe("bin");
    expect(extensionFromFilename("weird.ext.toolongext")).toBe("bin");
    expect(extensionFromFilename("file.")).toBe("bin");
  });
});
