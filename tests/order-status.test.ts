import { describe, expect, it } from "vitest";
import {
  canTransition,
  isOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
} from "@/types/admin";

describe("order status helpers", () => {
  it("recognizes valid statuses", () => {
    for (const status of ORDER_STATUSES) {
      expect(isOrderStatus(status)).toBe(true);
    }
    expect(isOrderStatus("refunded")).toBe(false);
    expect(isOrderStatus(null)).toBe(false);
  });

  it("allows forward transitions only", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "packed")).toBe(true);
    expect(canTransition("packed", "shipped")).toBe(true);
    expect(canTransition("shipped", "delivered")).toBe(true);
    expect(canTransition("pending", "delivered")).toBe(false);
    expect(canTransition("confirmed", "pending")).toBe(false);
  });

  it("allows cancellation from any non-terminal state", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("packed", "cancelled")).toBe(true);
    expect(canTransition("shipped", "cancelled")).toBe(true);
  });

  it("treats delivered and cancelled as terminal", () => {
    expect(ORDER_STATUS_TRANSITIONS.delivered).toHaveLength(0);
    expect(ORDER_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
    expect(canTransition("delivered", "shipped")).toBe(false);
    expect(canTransition("cancelled", "pending")).toBe(false);
  });

  it("treats a no-op transition as allowed", () => {
    expect(canTransition("pending", "pending")).toBe(true);
  });
});
