import { FeedSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-3 h-5 w-72" />
      <div className="mt-8">
        <FeedSkeleton />
      </div>
    </div>
  );
}
