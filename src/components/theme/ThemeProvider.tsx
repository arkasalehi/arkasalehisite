"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  window.addEventListener("as-theme", onChange);
  return () => window.removeEventListener("as-theme", onChange);
}

function snapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function serverSnapshot(): Theme {
  return "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("as_theme", theme);
  window.dispatchEvent(new Event("as-theme"));
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const toggle = useCallback(() => applyTheme(theme === "dark" ? "light" : "dark"), [theme]);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
