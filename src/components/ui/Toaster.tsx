"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; title: string; tone?: "success" | "error" };

type ToastCtx = { push: (title: string, tone?: Toast["tone"]) => void };

const ToastContext = createContext<ToastCtx>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((title: string, tone: Toast["tone"] = "success") => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev, { id, title, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2800);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed end-4 top-4 z-[90] flex w-[min(100%-2rem,360px)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-md border border-border bg-card px-3 py-2.5 text-sm shadow-lg ${
              item.tone === "error" ? "text-rose-300" : "text-foreground"
            }`}
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.tone === "error" ? "bg-rose-400" : "bg-primary"}`}
              aria-hidden
            />
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
