import { describe, expect, it } from "vitest";
import { orderQuerySchema, parseOrderQuery } from "@/lib/validation/order";

describe("order query parsing", () => {
  it("applies sensible defaults", () => {
    const query = parseOrderQuery({});
    expect(query.sort).toBe("created_at");
    expect(query.dir).toBe("desc");
    expect(query.page).toBe(1);
    expect(query.perPage).toBe(20);
    expect(query.status).toBeUndefined();
  });

  it("normalizes empty and 'all' status filters to undefined", () => {
    expect(parseOrderQuery({ status: "" }).status).toBeUndefined();
    expect(parseOrderQuery({ status: "all" }).status).toBeUndefined();
    expect(parseOrderQuery({ status: "pending" }).status).toBe("pending");
  });

  it("rejects invalid statuses", () => {
    expect(() => parseOrderQuery({ status: "refunded" })).toThrow();
  });

  it("accepts ISO dates and rejects malformed ones", () => {
    expect(parseOrderQuery({ from: "2026-01-01", to: "2026-12-31" }).from).toBe("2026-01-01");
    expect(() => parseOrderQuery({ from: "01/01/2026" })).toThrow();
  });

  it("clamps page and perPage within bounds", () => {
    expect(orderQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(orderQuerySchema.safeParse({ perPage: "4" }).success).toBe(false);
    expect(orderQuerySchema.safeParse({ perPage: "101" }).success).toBe(false);
    expect(orderQuerySchema.safeParse({ perPage: "50" }).success).toBe(true);
  });

  it("flattens array-valued search params", () => {
    const query = parseOrderQuery({ status: ["pending", "confirmed"] });
    expect(query.status).toBe("pending");
  });
});
