import type { ReactNode } from "react";
import { cn } from "./utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "positive" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    brand: "text-[var(--color-brand-soft)]",
    positive: "text-[var(--color-positive)]",
    warning: "text-[var(--color-warning)]",
    danger: "text-[var(--color-danger)]",
    neutral: "text-[var(--color-ink-soft)]",
  } as const;
  return (
    <div className="card flex items-start justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-[var(--color-ink-muted)]">{label}</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--color-ink)]">{value}</p>
        {hint ? <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{hint}</p> : null}
      </div>
      {icon ? (
        <span className={cn("rounded-xl bg-white/5 p-2.5", tones[tone])} aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </div>
  );
}
