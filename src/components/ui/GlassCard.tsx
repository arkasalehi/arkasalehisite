import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("glass glow-hover rounded-[1.5rem] p-5", className)}>{children}</div>;
}
