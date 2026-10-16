/**
 * Theme preferences for the Admin Dashboard.
 *
 * The resolved theme ("light" | "dark") is written to
 * `document.documentElement.dataset.theme` as early as possible (see the inline
 * script in app/layout.tsx) so the first paint uses the right palette. The
 * preference ("light" | "dark" | "system") is persisted in localStorage.
 */

export const THEME_STORAGE_KEY = "admin-theme";

export const THEMES = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof THEMES)[number];

export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/** Resolve a preference to a concrete theme using the OS setting for "system". */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/**
 * Inline script source injected into <head> before paint. Kept dependency-free
 * and defensive (private mode can throw on localStorage access).
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);if(p!=='light'&&p!=='dark'&&p!=='system'){p='system';}var d=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
