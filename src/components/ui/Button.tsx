"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { cn } from "@/lib/utils";

const variants = {
  primary: "sb-btn sb-btn-primary disabled:opacity-50",
  ghost: "sb-btn sb-btn-secondary disabled:opacity-50",
  subtle: "sb-btn sb-btn-secondary disabled:opacity-50",
  danger: "sb-btn sb-btn-danger disabled:opacity-50",
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
  const cls = cn(variants[variant], className);
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
