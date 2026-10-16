import { describe, expect, it } from "vitest";
import {
  isThemePreference,
  resolveTheme,
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  THEMES,
} from "@/lib/theme";

describe("theme preference", () => {
  it("exposes the three preferences", () => {
    expect(THEMES).toEqual(["light", "dark", "system"]);
    expect(THEME_STORAGE_KEY).toBe("admin-theme");
  });

  it("accepts only known preferences", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("solarized")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(undefined)).toBe(false);
  });

  it("resolves an explicit preference regardless of the OS setting", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("resolves system from the OS setting", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("emits an inline init script that targets the data-theme attribute", () => {
    expect(THEME_INIT_SCRIPT).toContain("data-theme");
    expect(THEME_INIT_SCRIPT).toContain(THEME_STORAGE_KEY);
  });
});
