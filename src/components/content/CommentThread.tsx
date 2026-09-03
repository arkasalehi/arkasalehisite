"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type CommentUser = { id: string; displayName: string; username: string; avatarUrl?: string | null };

export type CommentNode = {
  id: string;
  body: string;
  createdAt: string | Date;
  user: CommentUser;
  replies?: CommentNode[];
  pending?: boolean;
};

export function CommentThread({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: CommentNode[];
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const refresh = async () => {
      try {
        const res = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { comments: CommentNode[] };
        setComments(data.comments);
      } catch {
        /* ignore */
      }
    };
    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  async function submit(parentId?: string | null) {
    setError("");
    if (!user) {
      setError("برای نظر دادن وارد شوید.");
      return;
    }
    const text = body.trim();
    if (!text) return;

    const optimistic: CommentNode = {
      id: `tmp-${Date.now()}`,
      body: text,
      createdAt: new Date().toISOString(),
      pending: true,
      user: { id: user.id, displayName: user.displayName, username: user.username },
    };

    setComments((prev) => {
      if (!parentId) return [optimistic, ...prev];
      return prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies ?? []), optimistic] } : c,
      );
    });
    setBody("");
    setReplyTo(null);
    setLoading(true);

    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: text, parentId }),
      });
      if (!res.ok) throw new Error();
      const list = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" });
      if (list.ok) {
        const payload = (await list.json()) as { comments: CommentNode[] };
        setComments(payload.comments);
      }
      push("نظر ثبت شد");
    } catch {
      setComments(initialComments);
      setError("ارسال نشد");
      push("ارسال نظر ناموفق بود", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">نظرها</h2>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(replyTo);
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={replyTo ? "پاسخ شما…" : "نظر خود را بنویسید…"}
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <div className="flex items-center gap-2">
          <Button type="submit" loading={loading}>
            ارسال
          </Button>
          {replyTo ? (
            <button type="button" className="text-sm text-muted" onClick={() => setReplyTo(null)}>
              لغو پاسخ
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-8 space-y-4">
        {comments.map((comment) => (
          <article key={comment.id} className={`glass rounded-2xl p-4 ${comment.pending ? "opacity-60" : ""}`}>
            <header className="flex items-center gap-2 text-sm">
              <Avatar name={comment.user.displayName} src={comment.user.avatarUrl} size="sm" />
              <strong>{comment.user.displayName}</strong>
              <span className="ms-auto text-muted">{formatDate(comment.createdAt)}</span>
            </header>
            <p className="mt-2 leading-8 text-muted">{comment.body}</p>
            <button type="button" className="mt-2 text-xs text-accent" onClick={() => setReplyTo(comment.id)}>
              پاسخ
            </button>
            {comment.replies?.length ? (
              <div className="mt-3 space-y-3 border-r border-[var(--border)] pr-4">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-2">
                    <Avatar name={reply.user.displayName} src={reply.user.avatarUrl} size="sm" />
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <strong>{reply.user.displayName}</strong>
                        <span className="text-muted">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-muted">{reply.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {loading && !comments.length ? <Skeleton className="h-24" /> : null}
        {!comments.length && !loading ? <p className="text-muted">هنوز نظری ثبت نشده.</p> : null}
      </div>
    </section>
  );
}
