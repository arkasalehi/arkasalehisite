import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={cn("sb-fade-up", className)}>{children}</div>;
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sb-fade-up", className)}>{children}</div>;
}

export function FadeItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sb-fade-up", className)}>{children}</div>;
}

export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("sb-hover-lift h-full", className)}>{children}</div>;
}
