import { describe, expect, it } from "vitest";
import { bookCreateFinalSchema, bookCreateSchema, bookUpdateSchema } from "@/lib/validation/book";

const valid = {
  id: "hscenglishlasthour",
  title: "HSC English Last Hour",
  author: "",
  description: "",
  price: "350",
  offerPrice: "",
  deliveryCharge: "60",
  currency: "BDT",
  previewPageCount: "4",
  contentMode: "page-images",
  defaultMode: "flip",
  pageAspectRatio: "1.4",
  flipEnabled: "on",
  pdfEnabled: "on",
  minZoom: "0.75",
  maxZoom: "2.5",
  marketCountry: "Bangladesh",
  phoneRegion: "BD",
  isPublished: "true",
};

describe("book validation", () => {
  it("coerces and normalizes a valid create payload", () => {
    const parsed = bookCreateSchema.parse(valid);
    expect(parsed.price).toBe(350);
    expect(parsed.deliveryCharge).toBe(60);
    expect(parsed.previewPageCount).toBe(4);
    expect(parsed.author).toBeNull();
    expect(parsed.description).toBeNull();
    expect(parsed.offerPrice).toBeNull();
    expect(parsed.flipEnabled).toBe(true);
    expect(parsed.isPublished).toBe(true);
  });

  it("keeps a provided offer price", () => {
    const parsed = bookCreateSchema.parse({ ...valid, offerPrice: "300" });
    expect(parsed.offerPrice).toBe(300);
  });

  it("rejects invalid ids", () => {
    expect(bookCreateSchema.safeParse({ ...valid, id: "Bad Id" }).success).toBe(false);
    expect(bookCreateSchema.safeParse({ ...valid, id: "-leading" }).success).toBe(false);
  });

  it("requires a title", () => {
    expect(bookCreateSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(bookCreateSchema.safeParse({ ...valid, price: "-1" }).success).toBe(false);
  });

  it("folds booleans from various truthy strings", () => {
    expect(bookCreateSchema.parse({ ...valid, isPublished: "false" }).isPublished).toBe(false);
    expect(bookCreateSchema.parse({ ...valid, isPublished: "1" }).isPublished).toBe(true);
    expect(bookCreateSchema.parse({ ...valid, isPublished: "on" }).isPublished).toBe(true);
  });

  it("treats an omitted checkbox as false (unchecked boxes are not submitted)", () => {
    const { flipEnabled, pdfEnabled, isPublished, ...withoutCheckboxes } = valid;
    void flipEnabled;
    void pdfEnabled;
    void isPublished;
    const parsed = bookCreateSchema.parse(withoutCheckboxes);
    expect(parsed.flipEnabled).toBe(false);
    expect(parsed.pdfEnabled).toBe(false);
    expect(parsed.isPublished).toBe(false);
  });

  it("enforces maxZoom >= minZoom at the final stage", () => {
    const bad = bookCreateFinalSchema.safeParse({ ...valid, minZoom: "3", maxZoom: "2" });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues.some((issue) => issue.path.includes("maxZoom"))).toBe(true);
    }
  });

  it("omits the id from the update schema", () => {
    const parsed = bookUpdateSchema.parse({ ...valid });
    expect("id" in parsed).toBe(false);
  });
});
