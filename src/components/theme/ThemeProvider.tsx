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
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("as_theme", theme);
  document.cookie = `as_theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
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
    try {
      const stored = localStorage.getItem("as_theme");
      if (stored !== "dark" && stored !== "light") return;
      applyTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
