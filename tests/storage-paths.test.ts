import { describe, expect, it } from "vitest";
import {
  buildCoverPath,
  buildPagePath,
  buildPdfPath,
  buildPreviewPdfPath,
  extensionFromFilename,
  normalizeExt,
} from "@/lib/storage/paths";

describe("storage path conventions", () => {
  it("builds cover paths matching the website convention", () => {
    expect(buildCoverPath("hscenglishlasthour")).toBe("books/hscenglishlasthour/cover.webp");
    expect(buildCoverPath("book-1", "png")).toBe("books/book-1/cover.png");
  });

  it("builds pdf and preview paths", () => {
    expect(buildPdfPath("b1")).toBe("books/b1/book.pdf");
    expect(buildPreviewPdfPath("b1")).toBe("books/b1/preview.pdf");
  });

  it("zero-pads page numbers to three digits", () => {
    expect(buildPagePath("b1", 1)).toBe("books/b1/pages/001.webp");
    expect(buildPagePath("b1", 42, "jpg")).toBe("books/b1/pages/042.jpg");
    expect(buildPagePath("b1", 1234)).toBe("books/b1/pages/1234.webp");
  });

  it("normalizes extensions", () => {
    expect(normalizeExt(".PNG")).toBe("png");
    expect(normalizeExt("jpeg")).toBe("jpeg");
  });

  it("derives a safe extension from filenames", () => {
    expect(extensionFromFilename("My Book.PDF")).toBe("pdf");
    expect(extensionFromFilename("photo.webp?token=abc")).toBe("webp");
    expect(extensionFromFilename("no-extension")).toBe("bin");
    expect(extensionFromFilename("weird.ext.toolongext")).toBe("bin");
    expect(extensionFromFilename("file.")).toBe("bin");
  });
});
