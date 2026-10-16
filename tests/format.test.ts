import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, formatMoney, shortenId } from "@/lib/format";

describe("formatting helpers", () => {
  it("formats BDT amounts", () => {
    expect(formatMoney(350)).toBe("৳350");
    expect(formatMoney(1500.5)).toBe("৳1,500.50");
  });

  it("formats non-BDT currencies", () => {
    expect(formatMoney(100, "USD")).toBe("USD 100");
  });

  it("handles non-finite amounts gracefully", () => {
    expect(formatMoney(Number.NaN)).toBe("৳0");
  });

  it("formats byte sizes", () => {
    expect(formatBytes(0)).toBe("—");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("shortens long ids", () => {
    expect(shortenId("1234567890", 4)).toBe("1234…");
    expect(shortenId("abc", 4)).toBe("abc");
  });

  it("formats dates and handles invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate("2026-01-15")).toMatch(/2026/);
  });
});
