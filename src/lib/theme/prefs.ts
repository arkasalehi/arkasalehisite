import type { WsLocale } from "@/lib/workspace/copy";

export type WsTheme = "dark" | "light";
export type { WsLocale };

export function parseWsTheme(value?: string | null): WsTheme | null {
  return value === "light" || value === "dark" ? value : null;
}

export function parseWsLocale(value?: string | null): WsLocale | null {
  return value === "fa" || value === "en" ? value : null;
}

export function wsThemeOrDefault(value?: string | null): WsTheme {
  return parseWsTheme(value) ?? "dark";
}

export function wsLocaleOrDefault(value?: string | null): WsLocale {
  return parseWsLocale(value) ?? "fa";
}
