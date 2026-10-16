"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/feedback";
import { updateOrderStatusAction } from "@/lib/orders/actions";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/types/admin";
import { IconCheck, IconX } from "@/components/ui/icons";

export function OrderStatusControl({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus];

  function change(status: OrderStatus) {
    setError(null);
    setActive(status);
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status });
      if (!result.ok) {
        setError(result.message ?? "Could not update status.");
        setActive(null);
        return;
      }
      router.refresh();
    });
  }

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-muted)]">
        This order is <strong>{ORDER_STATUS_LABELS[currentStatus]}</strong> and cannot change further.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => {
          const isCancel = status === "cancelled";
          const isBusy = pending && active === status;
          return (
            <Button
              key={status}
              type="button"
              variant={isCancel ? "danger" : "primary"}
              size="md"
              disabled={pending}
              onClick={() => change(status)}
            >
              {isBusy ? (
                <Spinner className="h-3.5 w-3.5" />
              ) : isCancel ? (
                <IconX width={15} height={15} />
              ) : (
                <IconCheck width={15} height={15} />
              )}
              Mark {ORDER_STATUS_LABELS[status].toLowerCase()}
            </Button>
          );
        })}
      </div>
      {error ? (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-xs text-[var(--color-ink-muted)]">
        Status moves forward only (pending → confirmed → packed → shipped → delivered). Cancelling is
        allowed until delivery.
      </p>
    </div>
  );
}
