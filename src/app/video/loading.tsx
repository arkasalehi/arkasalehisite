import { FeedSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-10 w-32" />
      <div className="mt-8">
        <FeedSkeleton />
      </div>
    </div>
  );
}
