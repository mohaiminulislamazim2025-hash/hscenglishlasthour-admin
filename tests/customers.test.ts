import { beforeEach, describe, expect, it, vi } from "vitest";
import { listCustomers } from "@/lib/orders/customers";
import { listOrderAggregates } from "@/lib/orders/repository";
import type { OrderAggregateRow } from "@/lib/orders/repository";

vi.mock("@/lib/orders/repository", () => ({
  listOrderAggregates: vi.fn(),
}));

const mockedAggregates = vi.mocked(listOrderAggregates);

function row(overrides: Partial<OrderAggregateRow>): OrderAggregateRow {
  return {
    status: "pending",
    totalBdt: 410,
    createdAt: "2026-01-01T10:00:00.000Z",
    customerName: "Karim",
    customerMobile: "01700000000",
    customerAddress: "Dhaka",
    ...overrides,
  };
}

describe("listCustomers", () => {
  beforeEach(() => {
    mockedAggregates.mockReset();
  });

  it("groups orders by mobile number", async () => {
    mockedAggregates.mockResolvedValue([
      row({ createdAt: "2026-01-01T10:00:00.000Z" }),
      row({ createdAt: "2026-02-01T10:00:00.000Z", totalBdt: 500, customerAddress: "Chattogram" }),
      row({ customerMobile: "01800000000", customerName: "Rahim", totalBdt: 410 }),
    ]);

    const customers = await listCustomers();
    expect(customers).toHaveLength(2);

    const karim = customers.find((c) => c.mobile === "01700000000");
    expect(karim).toBeDefined();
    expect(karim!.orderCount).toBe(2);
    expect(karim!.totalSpent).toBe(910);
    expect(karim!.addresses).toEqual(["Dhaka", "Chattogram"]);
  });

  it("excludes cancelled orders from total spent but counts them", async () => {
    mockedAggregates.mockResolvedValue([
      row({ status: "delivered", totalBdt: 410 }),
      row({ status: "cancelled", totalBdt: 410 }),
    ]);

    const customers = await listCustomers();
    const customer = customers[0];
    expect(customer.orderCount).toBe(2);
    expect(customer.totalSpent).toBe(410);
    expect(customer.statuses.cancelled).toBe(1);
    expect(customer.statuses.delivered).toBe(1);
  });

  it("uses the most recent order's name and date", async () => {
    mockedAggregates.mockResolvedValue([
      row({ createdAt: "2026-01-01T10:00:00.000Z", customerName: "Old Name" }),
      row({ createdAt: "2026-05-01T10:00:00.000Z", customerName: "New Name" }),
    ]);

    const customers = await listCustomers();
    expect(customers[0].name).toBe("New Name");
    expect(customers[0].lastOrderAt).toBe("2026-05-01T10:00:00.000Z");
  });

  it("returns an empty list when there are no orders", async () => {
    mockedAggregates.mockResolvedValue([]);
    expect(await listCustomers()).toEqual([]);
  });
});
