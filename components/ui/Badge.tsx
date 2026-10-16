import type { ReactNode } from "react";
import { cn, statusTone } from "./utils";

export function Badge({
  children,
  tone,
  className,
}: {
  children: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tone ? statusTone(tone) : "border-white/10 bg-white/5 text-[var(--color-ink-soft)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
