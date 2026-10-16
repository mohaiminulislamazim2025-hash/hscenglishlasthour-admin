"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, buttonClass } from "./Button";
import { Spinner } from "./feedback";
import { IconAlert } from "./icons";
import { cn } from "./utils";

/**
 * Accessible confirmation dialog for destructive actions. Wraps a hidden form
 * that submits a server action only after the user confirms.
 */
export function ConfirmForm({
  action,
  fields,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  trigger,
  triggerClassName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Array<{ name: string; value: string }>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  trigger: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <form ref={formRef} action={action} className="hidden" aria-hidden>
        {fields.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
      </form>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="card animate-fade-up w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  variant === "danger" ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300",
                )}
              >
                <IconAlert />
              </span>
              <div className="min-w-0">
                <h2 id="confirm-title" className="text-sm font-semibold text-[var(--color-ink)]">
                  {title}
                </h2>
                {description ? (
                  <div className="mt-1 text-xs text-[var(--color-ink-muted)]">{description}</div>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              {cancelLabel ? (
                <button
                  type="button"
                  className={buttonClass("secondary", "md")}
                  onClick={() => setOpen(false)}
                >
                  {cancelLabel}
                </button>
              ) : null}
              <ConfirmSubmitButton
                variant={variant}
                label={confirmLabel}
                onClick={() => formRef.current?.requestSubmit()}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ConfirmSubmitButton({
  label,
  variant,
  onClick,
}: {
  label: string;
  variant: "danger" | "primary";
  onClick: () => void;
}) {
  return (
    <Button variant={variant} size="md" onClick={onClick}>
      {label}
    </Button>
  );
}

export function PendingText({ idle, pending }: { idle: string; pending: string }) {
  const { pending: isPending } = useFormStatus();
  return (
    <span className="inline-flex items-center gap-2">
      {isPending ? <Spinner className="h-3.5 w-3.5" /> : null}
      {isPending ? pending : idle}
    </span>
  );
}
