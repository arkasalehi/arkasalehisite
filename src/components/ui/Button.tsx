"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-[#3390ec] text-white hover:bg-[#2b84d9] disabled:opacity-50",
  ghost: "border border-[var(--border)] bg-white/70 text-foreground hover:bg-white disabled:opacity-50",
  subtle: "bg-white/80 text-foreground border border-[var(--border)] hover:border-[#3390ec]/30",
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
