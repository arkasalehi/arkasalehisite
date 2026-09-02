"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-gradient-to-l from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_var(--glow)] hover:brightness-110",
  ghost:
    "border border-[var(--border)] bg-transparent text-foreground hover:border-cyan-400/40 hover:bg-foreground/5",
  subtle: "bg-foreground/6 text-foreground hover:bg-foreground/10",
  danger: "bg-rose-500/90 text-white hover:bg-rose-400",
};

export function Button({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  href?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition",
    variants[variant],
    className,
  );

  if (href) {
    return (
      <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
        <Link href={href} className={cls}>
          {children}
        </Link>
      </motion.span>
    );
  }

  return (
    <motion.span whileTap={{ scale: 0.97 }} className="inline-flex">
      <button className={cls} {...props}>
        {children}
      </button>
    </motion.span>
  );
}
