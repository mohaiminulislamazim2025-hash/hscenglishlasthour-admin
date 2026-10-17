import { describe, expect, it } from "vitest";
import { productCreateSchema, productUpdateSchema } from "@/lib/validation/product";

const valid = {
  name: "Classic White Tee",
  description: "100% cotton",
  priceBdt: "750",
  stockQuantity: "12",
  sortOrder: "1",
  isAvailable: "true",
};

describe("product validation", () => {
  it("coerces and normalizes a valid create payload", () => {
    const parsed = productCreateSchema.parse(valid);
    expect(parsed.name).toBe("Classic White Tee");
    expect(parsed.priceBdt).toBe(750);
    expect(parsed.stockQuantity).toBe(12);
    expect(parsed.sortOrder).toBe(1);
    expect(parsed.isAvailable).toBe(true);
  });

  it("turns blank optional text into null", () => {
    const parsed = productCreateSchema.parse({ ...valid, description: "   " });
    expect(parsed.description).toBeNull();
  });

  it("requires a name", () => {
    expect(productCreateSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });

  it("rejects negative prices", () => {
    expect(productCreateSchema.safeParse({ ...valid, priceBdt: "-1" }).success).toBe(false);
  });

  it("rejects negative or fractional stock and sort order", () => {
    expect(productCreateSchema.safeParse({ ...valid, stockQuantity: "-2" }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...valid, stockQuantity: "1.5" }).success).toBe(false);
    expect(productCreateSchema.safeParse({ ...valid, sortOrder: "-1" }).success).toBe(false);
  });

  it("folds booleans from various truthy strings", () => {
    expect(productCreateSchema.parse({ ...valid, isAvailable: "false" }).isAvailable).toBe(false);
    expect(productCreateSchema.parse({ ...valid, isAvailable: "1" }).isAvailable).toBe(true);
    expect(productCreateSchema.parse({ ...valid, isAvailable: "on" }).isAvailable).toBe(true);
  });

  it("treats an omitted availability checkbox as false", () => {
    const { isAvailable, ...withoutCheckbox } = valid;
    void isAvailable;
    expect(productCreateSchema.parse(withoutCheckbox).isAvailable).toBe(false);
  });

  it("applies to the update schema too", () => {
    const parsed = productUpdateSchema.parse({ ...valid, name: "Updated" });
    expect(parsed.name).toBe("Updated");
  });
});
