"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { cn } from "@/components/ui/utils";
import { IconMonitor, IconMoon, IconSun } from "@/components/ui/icons";
import {
  isThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";

const THEME_EVENT = "admin-theme-change";

const OPTIONS = [
  { value: "light", label: "Light", Icon: IconSun },
  { value: "dark", label: "Dark", Icon: IconMoon },
  { value: "system", label: "System", Icon: IconMonitor },
] as const satisfies ReadonlyArray<{
  value: ThemePreference;
  label: string;
  Icon: (props: { width?: number; height?: number }) => ReactElement;
}>;

/** Apply a preference to <html> now, resolving "system" from the OS setting. */
function applyPreference(preference: ThemePreference): void {
  const resolved = resolveTheme(preference, window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", resolved);
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    // Re-resolve only when following the OS setting; always notify React.
    if (readPreference() === "system") applyPreference("system");
    onChange();
  };
  window.addEventListener(THEME_EVENT, handler);
  window.addEventListener("storage", handler);
  media.addEventListener("change", handler);
  return () => {
    window.removeEventListener(THEME_EVENT, handler);
    window.removeEventListener("storage", handler);
    media.removeEventListener("change", handler);
  };
}

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system");

  function choose(next: ThemePreference): void {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // storage can be unavailable (private mode); the session still updates
    }
    applyPreference(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-white/8 bg-white/5 p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => choose(value)}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-lg transition",
              active
                ? "bg-white/10 text-[var(--color-ink)] shadow-[inset_0_0_0_1px_var(--glass-border)]"
                : "text-[var(--color-ink-muted)] hover:bg-white/8 hover:text-[var(--color-ink)]",
            )}
          >
            <Icon width={15} height={15} />
          </button>
        );
      })}
    </div>
  );
}
