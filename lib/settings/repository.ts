import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoreSettings } from "@/types/admin";

export const STORE_SETTINGS_TABLE = "store_settings";

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await getSupabaseAdminClient()
    .from(STORE_SETTINGS_TABLE)
    .select("delivery_charge_bdt, currency")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return { deliveryChargeBdt: 0, currency: "BDT" };
  }
  const deliveryChargeBdt = typeof data.delivery_charge_bdt === "number" ? data.delivery_charge_bdt : Number(data.delivery_charge_bdt) || 0;
  const currency = typeof data.currency === "string" && data.currency ? data.currency : "BDT";
  return { deliveryChargeBdt, currency };
}

export async function updateDeliveryCharge(deliveryChargeBdt: number): Promise<StoreSettings> {
  const { data, error } = await getSupabaseAdminClient()
    .from(STORE_SETTINGS_TABLE)
    .update({ delivery_charge_bdt: deliveryChargeBdt, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("delivery_charge_bdt, currency")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not update store settings.");
  }
  return {
    deliveryChargeBdt: Number(data.delivery_charge_bdt) || 0,
    currency: String(data.currency ?? "BDT"),
  };
}
