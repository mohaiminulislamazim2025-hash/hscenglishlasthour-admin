"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorderPagesAction } from "@/lib/books/actions";
import { Spinner } from "@/components/ui/feedback";
import { IconChevronDown, IconChevronUp } from "@/components/ui/icons";
import { cn } from "@/components/ui/utils";

export function ReorderButtons({
  bookId,
  orderedIds,
  index,
}: {
  bookId: string;
  orderedIds: string[];
  index: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      const result = await reorderPagesAction({ bookId, orderedIds: next });
      if (!result.ok) {
        window.alert(result.message ?? "Could not reorder pages.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => move(-1)}
        disabled={pending || index === 0}
        aria-label="Move earlier"
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-[var(--color-ink-soft)] transition hover:bg-white/8 disabled:opacity-40",
        )}
      >
        <IconChevronUp width={14} height={14} />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        disabled={pending || index === orderedIds.length - 1}
        aria-label="Move later"
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/8 text-[var(--color-ink-soft)] transition hover:bg-white/8 disabled:opacity-40"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : <IconChevronDown width={14} height={14} />}
      </button>
    </div>
  );
}
