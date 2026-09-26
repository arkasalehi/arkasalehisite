"use client";

import { useEffect } from "react";

export function ViewHit({ postId }: { postId: string }) {
  useEffect(() => {
    void fetch("/api/posts/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(() => undefined);
  }, [postId]);
  return null;
}
