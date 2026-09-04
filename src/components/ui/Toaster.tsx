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
      <div className="pointer-events-none fixed inset-x-4 bottom-6 z-50 mx-auto flex w-auto max-w-sm flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto surface px-4 py-3 text-sm ${
              item.tone === "error" ? "text-rose-400" : "text-foreground"
            }`}
          >
            {item.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
