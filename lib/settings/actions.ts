"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction, AuthorizationError } from "@/lib/auth/dal";
import { updateDeliveryCharge } from "./repository";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";

export async function updateStoreSettingsAction(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdminAction();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }

  const value = String(formData.get("deliveryCharge") ?? "").trim();
  const charge = Number(value);
  if (!Number.isFinite(charge) || charge < 0) {
    return actionError("Delivery charge must be a non-negative number.", { deliveryCharge: "Invalid value." });
  }

  try {
    await updateDeliveryCharge(charge);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Could not update settings.");
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return actionSuccess("Store settings saved.");
}
