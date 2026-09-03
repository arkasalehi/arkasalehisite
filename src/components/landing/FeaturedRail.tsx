import { PostCard, type PostCardPost } from "@/components/content/PostCard";

export function FeaturedRail({ posts }: { posts: PostCardPost[] }) {
  if (!posts.length) return null;
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
      {posts.map((post) => (
        <div key={post.id} className="w-[min(86vw,22rem)] shrink-0 snap-start md:w-[28rem]">
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
}
