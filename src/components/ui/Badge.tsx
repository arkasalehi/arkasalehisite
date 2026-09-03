import { cn } from "@/lib/utils";

const tones = {
  default: "border-[var(--border)] bg-[var(--glass)] text-accent",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  muted: "border-[var(--border)] bg-foreground/5 text-muted",
  danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs backdrop-blur",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
