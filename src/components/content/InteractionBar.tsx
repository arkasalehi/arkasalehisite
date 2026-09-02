import { LikeButton } from "./LikeButton";
import { BookmarkButton } from "./BookmarkButton";
import { formatNumber } from "@/lib/utils";

export function InteractionBar({
  postId,
  liked,
  saved,
  likeCount,
  commentCount,
}: {
  postId: string;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  commentCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LikeButton postId={postId} initialLiked={liked} initialCount={likeCount} />
      <BookmarkButton postId={postId} initialSaved={saved} />
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
        {formatNumber(commentCount)} نظر
      </span>
    </div>
  );
}
