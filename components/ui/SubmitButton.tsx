"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Spinner } from "./feedback";
import { cn } from "./utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending || disabled}
      title={title}
    >
      {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
      <span>{pending ? (pendingLabel ?? "Working…") : children}</span>
    </Button>
  );
}

export function InlineSubmit({
  children,
  title,
  tone = "neutral",
}: {
  children: ReactNode;
  title?: string;
  tone?: "neutral" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={title}
      disabled={pending}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 transition disabled:opacity-50",
        tone === "danger"
          ? "text-rose-300 hover:bg-rose-500/15"
          : "text-[var(--color-ink-soft)] hover:bg-white/8",
      )}
    >
      {pending ? <Spinner className="h-3.5 w-3.5" /> : children}
    </button>
  );
}
