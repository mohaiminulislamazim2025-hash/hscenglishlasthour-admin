"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Alert } from "@/components/ui/feedback";
import { updateStoreSettingsAction } from "@/lib/settings/actions";
import type { ActionResult } from "@/lib/actions/types";

export function StoreSettingsForm({ deliveryCharge }: { deliveryCharge: number }) {
  const [state, action] = useActionState<ActionResult | undefined, FormData>(
    updateStoreSettingsAction,
    undefined,
  );

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      {state?.message && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
      {state?.ok && state.message ? <Alert tone="success">{state.message}</Alert> : null}
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Delivery charge (BDT)" htmlFor="deliveryCharge" error={state?.fieldErrors?.deliveryCharge} className="w-40">
          <Input
            id="deliveryCharge"
            name="deliveryCharge"
            type="number"
            min="0"
            step="0.01"
            defaultValue={deliveryCharge}
            required
          />
        </Field>
        <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
      </div>
      <p className="text-xs text-[var(--color-ink-muted)]">
        Applied to new orders at checkout. Requires the server secret key to be configured.
      </p>
    </form>
  );
}
