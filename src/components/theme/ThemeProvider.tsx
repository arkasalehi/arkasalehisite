"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

function subscribe(onChange: () => void) {
  window.addEventListener("as-theme", onChange);
  return () => window.removeEventListener("as-theme", onChange);
}

function snapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("ws")) return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("as_theme", theme);
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `as_theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event("as-theme"));
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const theme = useSyncExternalStore(subscribe, snapshot, () => initialTheme);
  const toggle = useCallback(() => applyTheme(theme === "dark" ? "light" : "dark"), [theme]);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  useEffect(() => {
    if (document.documentElement.classList.contains("ws")) return;
    try {
      const stored = localStorage.getItem("as_theme");
      if (stored !== "dark" && stored !== "light") return;
      if (snapshot() === stored) return;
      applyTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
