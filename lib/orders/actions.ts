"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction, AuthorizationError } from "@/lib/auth/dal";
import { getOrder, updateOrderStatus } from "./repository";
import { canTransition, isOrderStatus, type OrderStatus } from "@/types/admin";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateOrderStatusAction(payload: {
  orderId: string;
  status: string;
}): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }

  if (!payload.orderId || !isOrderStatus(payload.status)) {
    return actionError("Invalid status update.");
  }

  const order = await getOrder(payload.orderId);
  if (!order) return actionError("Order not found.");

  const from = order.status;
  const to: OrderStatus = payload.status;
  if (!canTransition(from, to)) {
    return actionError(`Cannot change status from ${from} to ${to}.`);
  }

  try {
    await updateOrderStatus(payload.orderId, to);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Could not update the order.");
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${payload.orderId}`);
  revalidatePath("/");
  return actionSuccess(`Order marked ${to}.`);
}
