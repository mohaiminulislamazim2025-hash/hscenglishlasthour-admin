export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-400/12 text-amber-300 border-amber-300/25",
  confirmed: "bg-sky-400/12 text-sky-300 border-sky-300/25",
  packed: "bg-indigo-400/12 text-indigo-300 border-indigo-300/25",
  shipped: "bg-violet-400/12 text-violet-300 border-violet-300/25",
  delivered: "bg-emerald-400/12 text-emerald-300 border-emerald-300/25",
  cancelled: "bg-rose-400/12 text-rose-300 border-rose-300/25",
  published: "bg-emerald-400/12 text-emerald-300 border-emerald-300/25",
  draft: "bg-slate-400/12 text-slate-300 border-slate-300/25",
};

export function statusTone(status: string): string {
  return STATUS_TONE[status] ?? "bg-slate-400/12 text-slate-300 border-slate-300/25";
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
