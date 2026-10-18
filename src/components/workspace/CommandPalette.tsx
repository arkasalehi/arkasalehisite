"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

type Hit = { href: string; label: string; group: string };

export function CommandPalette({
  channels,
  tasks,
  notes,
  meetings,
}: {
  channels: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string }>;
  notes: Array<{ id: string; title: string }>;
  meetings: Array<{ id: string; title: string }>;
}) {
  const { t } = useWsChrome();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActive(0);
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setActive(0);
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("ws:command", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ws:command", onOpen as EventListener);
    };
  }, []);

  const hits = useMemo(() => {
    const items: Hit[] = [
      { href: "/ws", label: t.inbox, group: t.apps },
      { href: "/ws/tasks", label: t.tasksNav, group: t.apps },
      { href: "/ws/docs", label: t.documents, group: t.apps },
      { href: "/ws/chat", label: t.chat, group: t.apps },
      { href: "/ws/meet", label: t.office, group: t.apps },
      { href: "/ws/calendar", label: t.calendar, group: t.apps },
      { href: "/ws/people", label: t.people, group: t.apps },
      ...channels.map((c) => ({ href: `/ws/chat/${c.id}`, label: c.name, group: t.chat })),
      ...tasks.slice(0, 20).map((task) => ({ href: "/ws/tasks", label: task.title, group: t.tracker })),
      ...notes.map((n) => ({ href: `/ws/docs/${n.id}`, label: n.title, group: t.documents })),
      ...meetings.map((m) => ({ href: `/ws/meet/${m.id}`, label: m.title, group: t.office })),
    ];
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 12);
    return items.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 16);
  }, [channels, meetings, notes, q, t, tasks]);

  function go(hit: Hit | undefined) {
    if (!hit) return;
    setOpen(false);
    setQ("");
    router.push(hit.href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start bg-black/60 p-4 pt-[14vh]" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.search}
        className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-[var(--theme-divider-color)] bg-[#1c1c1c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          }
          if (e.key === "Enter") {
            e.preventDefault();
            go(hits[active]);
          }
        }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder={t.search}
          className="h-12 w-full border-b border-[var(--theme-divider-color)] bg-transparent px-4 text-[14px] text-[#ededed] outline-none placeholder:text-[#8f8f8f]"
        />
        <ul className="ws-scroll max-h-80 overflow-auto p-1.5">
          {hits.length === 0 ? <li className="px-3 py-6 text-center text-[13px] text-[#8f8f8f]">نتیجه‌ای نیست</li> : null}
          {hits.map((hit, index) => (
            <li key={`${hit.href}-${hit.label}`}>
              <button
                type="button"
                className={cn("flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-[13px] text-[#ededed]", index === active ? "bg-[#3ecf8e]/15 text-[#3ecf8e]" : "hover:bg-white/5")}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(hit)}
              >
                <span>{hit.label}</span>
                <span className="font-mono text-[10px] text-[#8f8f8f]">{hit.group}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 border-t border-[var(--theme-divider-color)] px-3 py-2 font-mono text-[10px] text-[#8f8f8f]">
          <span>↑↓</span>
          <span>enter</span>
          <span className="ms-auto">esc</span>
        </div>
      </div>
    </div>
  );
}
