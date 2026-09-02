import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("glass glow-hover rounded-3xl p-5", className)}>{children}</div>;
}

export function GlassCard(props: { className?: string; children: React.ReactNode }) {
  return <Card {...props} />;
}
