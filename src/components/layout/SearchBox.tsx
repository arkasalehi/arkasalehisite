"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { postPath, excerpt } from "@/lib/utils";
import type { PostType } from "@/lib/types";
import { SearchIcon } from "@/components/icons";

type Hit = {
  id: string;
  title: string;
  slug: string;
  type: PostType;
  excerpt?: string | null;
};

export function SearchBox() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { posts: Hit[] };
        setHits(data.posts);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className="relative hidden md:block">
      <label className="flex h-9 items-center gap-2 rounded-full px-3 text-muted">
        <SearchIcon className="h-4 w-4 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          placeholder="جستجو"
          className="w-24 bg-transparent text-sm text-foreground outline-none placeholder:text-muted lg:w-32"
          aria-label="جستجوی محتوا"
        />
      </label>
      {open && hits.length ? (
        <div className="surface absolute left-0 top-11 z-50 w-80 overflow-hidden p-0">
          {hits.map((hit) => (
            <Link
              key={hit.id}
              href={postPath(hit.type, hit.slug)}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              className="block px-3 py-2.5 hover:bg-foreground/5"
            >
              <p className="text-sm font-medium">{hit.title}</p>
              {hit.excerpt ? <p className="text-xs text-muted">{excerpt(hit.excerpt, 80)}</p> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
