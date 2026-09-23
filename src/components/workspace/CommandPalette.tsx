"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
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
      { href: "/ws", label: "Inbox", group: "Apps" },
      { href: "/ws/tasks", label: "Tasks", group: "Apps" },
      { href: "/ws/docs", label: "Documents", group: "Apps" },
      { href: "/ws/chat", label: "Chat", group: "Apps" },
      { href: "/ws/meet", label: "Office", group: "Apps" },
      ...channels.map((c) => ({ href: `/ws/chat/${c.id}`, label: c.name, group: "Chat" })),
      ...tasks.slice(0, 20).map((task) => ({ href: "/ws/tasks", label: task.title, group: "Tracker" })),
      ...notes.map((n) => ({ href: `/ws/docs/${n.id}`, label: n.title, group: "Documents" })),
      ...meetings.map((m) => ({ href: `/ws/meet/${m.id}`, label: m.title, group: "Office" })),
    ];
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, 12);
    return items.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 16);
  }, [channels, meetings, notes, q, tasks]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-start bg-black/50 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-[var(--ws-radius)] border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)]" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-12 w-full border-b border-[var(--theme-divider-color)] bg-transparent px-4 text-[length:var(--ws-type-md)] outline-none" />
        <ul className="ws-scroll max-h-80 overflow-auto p-1">
          {hits.map((hit) => (
            <li key={`${hit.href}-${hit.label}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[var(--ws-radius)] px-3 py-2 text-start text-[length:var(--ws-type-sm)] hover:bg-[var(--theme-navpanel-hovered)]"
                onClick={() => {
                  setOpen(false);
                  setQ("");
                  router.push(hit.href);
                }}
              >
                <span>{hit.label}</span>
                <span className="text-[11px] text-[var(--theme-darker-color)]">{hit.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
