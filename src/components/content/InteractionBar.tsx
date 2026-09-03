import { LikeButton } from "./LikeButton";
import { BookmarkButton } from "./BookmarkButton";
import { ShareButton } from "./ShareButton";
import { formatNumber } from "@/lib/utils";

export function InteractionBar({
  postId,
  liked,
  saved,
  likeCount,
  commentCount,
  title,
}: {
  postId: string;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  commentCount: number;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LikeButton postId={postId} initialLiked={liked} initialCount={likeCount} />
      <BookmarkButton postId={postId} initialSaved={saved} />
      <ShareButton title={title} />
      <a
        href="#comments"
        className="rounded-full border border-[var(--border)] bg-foreground/5 px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
      >
        {formatNumber(commentCount)} نظر
      </a>
    </div>
  );
}
