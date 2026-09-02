import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-foreground/8 px-2.5 py-1 text-xs text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
