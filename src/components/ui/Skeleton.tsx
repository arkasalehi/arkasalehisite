import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-foreground/10", className)} />;
}

export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/45 p-4">
      <div className="flex flex-col gap-5 rounded-[1.2em] bg-white/50 p-5 lg:flex-row">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl lg:w-64" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="surface overflow-hidden p-6">
      <Skeleton className="aspect-[4/3]" />
      <Skeleton className="mt-3 h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  );
}

export function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
