"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="بستن" onClick={onClose} />
      <div className="surface relative w-full max-w-lg p-6">
        {title ? <h2 className="text-xl font-medium">{title}</h2> : null}
        <div className={cn(title && "mt-4")}>{children}</div>
      </div>
    </div>
  );
}
