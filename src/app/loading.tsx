import { FeedSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="surface h-64 animate-pulse" />
      <FeedSkeleton />
    </div>
  );
}
