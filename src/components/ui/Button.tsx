"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-foreground text-background hover:opacity-90 disabled:opacity-50",
  ghost: "border border-[var(--border)] bg-transparent text-foreground hover:bg-[var(--card)]",
  subtle: "bg-[var(--card)] text-foreground border border-[var(--border)] hover:border-[color-mix(in_oklab,var(--fg)_18%,var(--border))]",
  danger: "bg-rose-600 text-white hover:opacity-90",
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
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-150",
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
