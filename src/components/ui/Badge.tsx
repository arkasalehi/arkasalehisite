import { cn } from "@/lib/utils";

const tones = {
  default: "border-[var(--border)] bg-[var(--card)] text-muted",
  success: "border-[var(--border)] bg-[var(--card)] text-[var(--status)]",
  warning: "border-[var(--border)] bg-[var(--card)] text-amber-700 dark:text-amber-300",
  muted: "border-[var(--border)] bg-[var(--card)] text-muted",
  danger: "border-[var(--border)] bg-[var(--card)] text-rose-600 dark:text-rose-300",
};

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
