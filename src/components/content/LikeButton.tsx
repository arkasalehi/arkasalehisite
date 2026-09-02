"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/icons";
import { formatNumber } from "@/lib/utils";
import { useAuth } from "@/components/providers";
import { useToast } from "@/components/ui/Toast";

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
  const [pop, setPop] = useState(0);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }

    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    if (next) setPop((n) => n + 1);

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
    <motion.button
      type="button"
      onClick={toggle}
      animate={{ scale: pop ? [1, 1.22, 1] : 1 }}
      transition={{ duration: 0.28 }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        liked
          ? "border-cyan-400/40 bg-cyan-400/10 text-accent"
          : "border-[var(--border)] bg-foreground/5 text-foreground hover:border-cyan-400/30"
      }`}
    >
      <HeartIcon filled={liked} className="h-4 w-5" />
      {formatNumber(count)}
    </motion.button>
  );
}
