import type { ComponentProps, ReactNode } from "react";
import { cn } from "./utils";

const INPUT =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]/70 px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] transition focus:border-[var(--color-brand)] focus:bg-[var(--color-surface-2)] focus:outline-none disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[var(--color-ink-soft)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(INPUT, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(INPUT, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(INPUT, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3 transition hover:border-[var(--color-brand-soft)]",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--color-ink)]">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
