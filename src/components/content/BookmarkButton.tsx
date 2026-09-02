"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkIcon } from "@/components/icons";
import { useAuth } from "@/components/providers";

export function BookmarkButton({
  postId,
  initialSaved,
}: {
  postId: string;
  initialSaved: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);

  async function toggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch("/api/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("bookmark failed");
      const data = (await res.json()) as { saved: boolean };
      setSaved(data.saved);
    } catch {
      setSaved(!next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        saved
          ? "border-cyan-400/40 bg-cyan-400/10 text-accent"
          : "border-[var(--border)] bg-foreground/5 text-foreground hover:border-cyan-400/30"
      }`}
    >
      <BookmarkIcon filled={saved} className="h-4 w-5" />
      {saved ? "ذخیره شد" : "ذخیره"}
    </button>
  );
}
