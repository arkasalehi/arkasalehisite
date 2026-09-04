"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/icons";
import { formatNumber } from "@/lib/utils";
import { useAuth } from "@/components/providers";
import { useToast } from "@/components/ui/Toaster";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }

    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("like failed");
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
      push("ذخیره پسند ممکن نشد", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        liked
          ? "border-foreground bg-foreground text-background"
          : "border-[var(--border)] bg-foreground/5 text-foreground hover:border-foreground/30"
      }`}
    >
      <HeartIcon filled={liked} className="h-4 w-5" />
      {formatNumber(count)}
    </button>
  );
}
