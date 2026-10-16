import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowLeft } from "@/components/ui/icons";

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <IconArrowLeft width={14} height={14} />
          {backLabel ?? "Back"}
        </Link>
      ) : null}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-ink)] sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
