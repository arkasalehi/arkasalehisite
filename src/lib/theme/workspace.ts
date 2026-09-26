"use client";

import { createContext, createElement, useContext, useLayoutEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";
import { parseWsLocale, parseWsTheme, type WsTheme, wsLocaleOrDefault, wsThemeOrDefault } from "@/lib/theme/prefs";

export type { WsTheme, WsLocale };

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function persistCookie(name: string, value: string) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function emitChrome() {
  window.dispatchEvent(new Event("ws:chrome"));
}

function subscribeChrome(onChange: () => void) {
  window.addEventListener("ws:chrome", onChange);
  window.addEventListener("ws:theme", onChange);
  window.addEventListener("ws:locale", onChange);
  return () => {
    window.removeEventListener("ws:chrome", onChange);
    window.removeEventListener("ws:theme", onChange);
    window.removeEventListener("ws:locale", onChange);
  };
}

export function storedWsTheme(): WsTheme {
  if (typeof document === "undefined") return "dark";
  return (
    parseWsTheme(readCookie("ws_theme")) ||
    parseWsTheme(localStorage.getItem("ws-theme")) ||
    (document.documentElement.classList.contains("ws-theme-light") ? "light" : "dark")
  );
}

export function storedWsLocale(): WsLocale {
  if (typeof document === "undefined") return "fa";
  return (
    parseWsLocale(readCookie("ws_locale")) ||
    parseWsLocale(localStorage.getItem("ws-locale")) ||
    (document.documentElement.lang === "en" ? "en" : "fa")
  );
}

export function applyWsTheme(theme: WsTheme) {
  const root = document.documentElement;
  root.classList.add("ws");
  root.classList.toggle("ws-theme-light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  localStorage.setItem("ws-theme", theme);
  persistCookie("ws_theme", theme);
  emitChrome();
  window.dispatchEvent(new CustomEvent("ws:theme", { detail: theme }));
}

export function setWsTheme(theme: WsTheme) {
  applyWsTheme(theme);
}

export function applyWsLocale(locale: WsLocale) {
  document.documentElement.lang = locale === "fa" ? "fa" : "en";
  document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  localStorage.setItem("ws-locale", locale);
  persistCookie("ws_locale", locale);
  emitChrome();
  window.dispatchEvent(new CustomEvent("ws:locale", { detail: locale }));
}

export function setWsLocale(locale: WsLocale) {
  applyWsLocale(locale);
}

export function restoreWsChrome() {
  applyWsTheme(storedWsTheme());
  applyWsLocale(storedWsLocale());
}

export function readWsTheme(): WsTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("ws-theme-light") ? "light" : "dark";
}

export function readWsLocale(): WsLocale {
  if (typeof document === "undefined") return "fa";
  return document.documentElement.lang === "en" ? "en" : "fa";
}

export function syncPublicThemeFromStorage() {
  const root = document.documentElement;
  root.classList.remove("ws", "ws-theme-light");
  root.lang = "fa";
  root.dir = "rtl";
  root.style.colorScheme = "";
  const stored = parseWsTheme(localStorage.getItem("as_theme")) || parseWsTheme(readCookie("as_theme"));
  root.classList.toggle("dark", stored === "dark");
  window.dispatchEvent(new Event("as-theme"));
}

type ChromeValue = { theme: WsTheme; locale: WsLocale; t: ReturnType<typeof wsCopy> };

const ChromeContext = createContext<ChromeValue | null>(null);

export function WsChromeProvider({
  initialTheme,
  initialLocale,
  children,
}: {
  initialTheme: WsTheme;
  initialLocale: WsLocale;
  children: ReactNode;
}) {
  const theme = useSyncExternalStore(subscribeChrome, storedWsTheme, () => wsThemeOrDefault(initialTheme));
  const locale = useSyncExternalStore(subscribeChrome, storedWsLocale, () => wsLocaleOrDefault(initialLocale));
  useLayoutEffect(() => {
    restoreWsChrome();
  }, []);
  const value = useMemo<ChromeValue>(() => ({ theme, locale, t: wsCopy(locale) }), [theme, locale]);
  return createElement(ChromeContext.Provider, { value }, children);
}

export function useWsChrome() {
  const ctx = useContext(ChromeContext);
  const theme = useSyncExternalStore(subscribeChrome, storedWsTheme, () => ctx?.theme ?? "dark");
  const locale = useSyncExternalStore(subscribeChrome, storedWsLocale, () => ctx?.locale ?? "fa");
  if (ctx) return ctx;
  return { theme, locale, t: wsCopy(locale) };
}
