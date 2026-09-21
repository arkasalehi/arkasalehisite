"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[#2f7de9] text-white shadow-[0_10px_24px_rgba(47,125,233,0.28)] hover:opacity-90 disabled:opacity-50",
  ghost: "border border-[var(--border)] bg-white/70 text-foreground hover:bg-white disabled:opacity-50",
  subtle: "bg-white/80 text-foreground border border-[var(--border)] hover:border-[#1b6754]/30",
  danger: "bg-rose-600 text-white hover:opacity-90",
};

export function Button({
  className,
  variant = "primary",
  href,
  loading = false,
  loadingLabel,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  href?: string;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,opacity,transform] duration-150",
    variants[variant],
    className,
  );
  const inner = loading ? loadingLabel ?? "در حال انجام…" : children;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} disabled={disabled || loading} {...props}>
      {inner}
    </button>
  );
}
