"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-[var(--primary)] text-white shadow-[0_0_28px_var(--glow)] hover:brightness-110 disabled:opacity-60",
  ghost:
    "border border-[var(--border)] bg-transparent text-foreground hover:border-[color-mix(in_oklab,var(--accent)_45%,var(--border))] hover:bg-foreground/5",
  subtle: "bg-foreground/6 text-foreground hover:bg-foreground/10",
  danger: "bg-rose-500/90 text-white hover:bg-rose-400",
};

export function Button({
  className,
  variant = "primary",
  href,
  loading = false,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  href?: string;
  loading?: boolean;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 hover:scale-[1.03] active:scale-[0.97]",
    variants[variant],
    className,
  );
  const inner = loading ? "در حال انجام…" : children;

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
