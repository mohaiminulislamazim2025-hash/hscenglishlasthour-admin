import type { ReactNode } from "react";
import { cn } from "./utils";

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-sky-300/25 bg-sky-400/10 text-sky-200",
    success: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-300/25 bg-amber-400/10 text-amber-200",
    danger: "border-rose-300/25 bg-rose-400/10 text-rose-200",
  } as const;
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)} role="status">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface-2)]/40 px-6 py-14 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[var(--color-brand-soft)]">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-md text-xs text-[var(--color-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full transition-[width] duration-200 [background-image:var(--grad-primary)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "spinner-ring inline-block h-4 w-4 animate-spin rounded-full border-2",
        className,
      )}
      aria-hidden="true"
    />
  );
}
