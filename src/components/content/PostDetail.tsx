import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { PostType } from "@/lib/types";
import { InteractionBar } from "@/components/content/InteractionBar";
import { JsonLd } from "@/components/content/JsonLd";
import { PostCard } from "@/components/content/PostCard";
import { ProductCard } from "@/components/content/ProductCard";
import { ArticleBody } from "@/components/content/ArticleBody";
import { TableOfContents } from "@/components/content/TableOfContents";
import { CoverImage } from "@/components/content/CoverImage";
import { Stagger } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSession } from "@/lib/auth/session";
import { listVisibleComments } from "@/lib/data/comments";
import { getUserPostState } from "@/lib/data/interactions";
import {
  getPostBySlugAny,
  getPublishedPostBySlug,
  getRelatedPosts,
  incrementPostViews,
} from "@/lib/data/posts";
import { articleJsonLd, videoJsonLd } from "@/lib/seo";
import { extractToc } from "@/lib/toc";
import { formatDate, formatNumber, postPath, typeLabel } from "@/lib/utils";

const VideoPlayer = dynamic(
  () => import("@/components/content/VideoPlayer").then((m) => m.VideoPlayer),
  { loading: () => <Skeleton className="aspect-video w-full" /> },
);

const CommentThread = dynamic(
  () => import("@/components/content/CommentThread").then((m) => m.CommentThread),
  { loading: () => <Skeleton className="mt-10 h-48 w-full" /> },
);

export async function PostDetail({
  slug,
  type,
  preview = false,
}: {
  slug: string;
  type?: PostType;
  preview?: boolean;
}) {
  const post = preview ? await getPostBySlugAny(slug) : await getPublishedPostBySlug(slug, type);
  if (!post) notFound();
  if (!preview && type && post.type !== type) notFound();

  const session = await getSession();
  const [state, comments, related] = await Promise.all([
    getUserPostState(session?.id, post.id),
    listVisibleComments(post.id),
    getRelatedPosts(post),
  ]);
  if (!preview) void incrementPostViews(post.id);

  const jsonLd = post.type === "BLOG" ? articleJsonLd(post) : videoJsonLd(post);
  const typeHref = post.type === "VIDEO" ? "/video" : post.type === "SHORT" ? "/shorts" : "/blog";
  const toc = post.body ? extractToc(post.body) : [];

  return (
    <article>
      {preview ? (
        <p className="mb-4 rounded-xl bg-amber-400/15 px-3 py-2 text-sm text-amber-200">پیش‌نمایش — هنوز عمومی نیست</p>
      ) : null}
      <JsonLd data={jsonLd} />
      <p className="text-sm text-muted">
        <Link href={typeHref}>{typeLabel(post.type)}</Link>
        {post.category ? (
          <>
            {" · "}
            <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
          </>
        ) : null}
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl">{post.title}</h1>
      <p className="mt-4 text-muted">
        {post.publishedAt ? formatDate(post.publishedAt) : ""}
        {post.readingTime ? ` · ${formatNumber(post.readingTime)} دقیقه مطالعه` : ""}
        {` · ${formatNumber(post.viewCount)} بازدید`}
      </p>

      <div className="editorial-media relative mt-8 aspect-[16/8] overflow-hidden rounded-[24px]">
        <CoverImage
          src={post.coverImage}
          alt={post.title}
          seed={post.id}
          kind={post.type === "VIDEO" ? "video" : post.type === "SHORT" ? "short" : "blog"}
          sizes="100vw"
          priority
        />
      </div>

      {post.videoUrl ? (
        <div className="mt-8">
          <VideoPlayer
            src={post.videoUrl}
            poster={post.thumbnailUrl || post.coverImage}
            vertical={post.type === "SHORT"}
            resumeKey={post.id}
            miniPlayer
          />
        </div>
      ) : null}

      {post.excerpt ? <p className="mt-6 max-w-3xl text-lg leading-9 text-muted">{post.excerpt}</p> : null}

      <div className="mt-6">
        <InteractionBar
          postId={post.id}
          liked={state.liked}
          saved={state.saved}
          likeCount={post._count.likes}
          commentCount={post._count.comments}
          title={post.title}
        />
      </div>

      {post.body ? (
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <ArticleBody body={post.body} />
          <TableOfContents items={toc} />
        </div>
      ) : null}

      {post.products.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-medium">محصولات داخل این مطلب</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {post.products.map((row) => (
              <ProductCard key={row.productId} product={row.product} compact />
            ))}
          </div>
        </section>
      ) : null}

      <div id="comments">
      <CommentThread
        postId={post.id}
        initialComments={comments.map((c) => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
          replies: c.replies.map((r) => ({
            ...r,
            createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
          })),
        }))}
      />
      </div>

      {related.length ? (
        <section className="mt-12">
          <h2 className="text-xl font-medium">مطالب مرتبط</h2>
          <Stagger className="mt-4 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </Stagger>
          <p className="mt-4 text-sm">
            <Link href={postPath(post.type, post.slug)} className="text-accent">
              {typeLabel(post.type)} بیشتر در{" "}
            </Link>
            <Link href={typeHref} className="text-accent">
              آرشیو {typeLabel(post.type)}
            </Link>
          </p>
        </section>
      ) : null}
    </article>
  );
}
