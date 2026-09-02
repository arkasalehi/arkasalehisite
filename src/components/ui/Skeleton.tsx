import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-foreground/10", className)} />;
}

export function PostCardSkeleton() {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
