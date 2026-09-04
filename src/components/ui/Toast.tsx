"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
      <div className="pointer-events-none fixed bottom-20 left-4 z-50 flex w-80 flex-col gap-2 md:bottom-6">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-auto surface px-4 py-3 text-sm ${
                item.tone === "error" ? "text-rose-400" : "text-foreground"
              }`}
            >
              {item.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
