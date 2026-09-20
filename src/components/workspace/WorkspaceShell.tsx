"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { publicSiteUrl } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { IconBack, IconCal, IconCall, IconChat, IconHome, IconSearch, IconSite, IconTasks } from "@/components/workspace/ws-icons";

const NAV = [
  { href: "/ws", label: "Home", icon: IconHome, match: (p: string) => p === "/ws" },
  { href: "/ws/chat", label: "Chat", icon: IconChat, match: (p: string) => p.startsWith("/ws/chat") },
  { href: "/ws/meet", label: "Call", icon: IconCall, match: (p: string) => p.startsWith("/ws/meet") },
  { href: "/ws/tasks", label: "Tasks", icon: IconTasks, match: (p: string) => p.startsWith("/ws/tasks") },
];

export function WorkspaceShell({
  children,
  displayName,
  channels,
}: {
  children: React.ReactNode;
  displayName: string;
  channels: Array<{ id: string; slug: string; name: string }>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const site = publicSiteUrl();
  const inThread = /^\/ws\/chat\/[^/]+/.test(pathname);
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(!inThread);
  const [compose, setCompose] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    setListOpen(!inThread);
  }, [inThread, pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((ch) => ch.name.toLowerCase().includes(q) || ch.slug.toLowerCase().includes(q));
  }, [channels, query]);

  const activeChannel = channels.find((ch) => pathname.includes(ch.id));
  const flush = inThread || pathname.startsWith("/ws/meet/");

  async function addNote() {
    const title = note.trim();
    if (!title) return;
    setNote("");
    setCompose(false);
    await fetch("/api/workspace/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    router.push("/ws");
    router.refresh();
  }

  return (
    <div className="ws-app ws-app-sky min-h-svh p-0 md:p-3 lg:p-5" dir="ltr">
      <div className="ws-window mx-auto flex h-svh max-w-[1440px] overflow-hidden rounded-none md:h-[calc(100svh-1.5rem)] md:rounded-[28px] lg:h-[calc(100svh-2.5rem)]">
        <nav className="hidden w-[72px] shrink-0 flex-col items-center border-r border-[#e8ece6] bg-white/70 py-4 lg:flex">
          <Link href="/ws" className="grid h-11 w-11 place-items-center rounded-2xl bg-[#1b6754] text-sm font-semibold text-white" aria-label="Workspace">
            A
          </Link>
          <div className="mt-6 flex flex-1 flex-col items-center gap-1.5">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} title={item.label} className={cn("grid h-11 w-11 place-items-center rounded-2xl", item.match(pathname) ? "bg-[#efe8ff] text-[#7c5cfc]" : "text-[#8b938d] hover:bg-white")}>
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              );
            })}
            <Link href="/ws/calendar" title="Calendar" className={cn("grid h-11 w-11 place-items-center rounded-2xl", pathname.startsWith("/ws/calendar") ? "bg-[#efe8ff] text-[#7c5cfc]" : "text-[#8b938d]")}>
              <IconCal className="h-[18px] w-[18px]" />
            </Link>
            <button type="button" onClick={() => setCompose(true)} className="mt-2 grid h-11 w-11 place-items-center rounded-full bg-[#7c5cfc] text-lg text-white" aria-label="Create">
              +
            </button>
          </div>
          <a href={site} title="Back to site" className="grid h-11 w-11 place-items-center rounded-2xl text-[#8b938d]">
            <IconSite className="h-[18px] w-[18px]" />
          </a>
          <span className="mt-2 grid h-10 w-10 place-items-center rounded-full bg-[#1b6754] text-xs font-semibold text-white">{initials(displayName)}</span>
        </nav>

        <aside className={cn("w-full shrink-0 flex-col border-r border-[#e8ece6] bg-[#f7f8f5] md:w-[300px]", inThread ? (listOpen ? "flex" : "hidden md:flex") : "hidden")}>
          <div className="px-4 pb-2 pt-5">
            <div className="flex items-center justify-between">
              <h1 className="text-[22px] font-semibold tracking-tight">Messages</h1>
              <Link href="/ws/meet" className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#1b6754]" aria-label="New call">
                <IconCall className="h-4 w-4" />
              </Link>
            </div>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-full bg-white px-3.5 ring-1 ring-[#e8ece6]">
              <IconSearch className="h-4 w-4 text-[#8b938d]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" placeholder="Search channels…" />
            </label>
          </div>
          <div className="ws-scroll min-h-0 flex-1 overflow-auto px-2 pb-4">
            <ul className="space-y-0.5">
              {filtered.map((ch) => (
                <li key={ch.id}>
                  <Link href={`/ws/chat/${ch.id}`} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", pathname.includes(ch.id) ? "bg-white shadow-sm" : "hover:bg-white/70")}>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#3d8fe0] text-sm font-semibold text-white">{initials(ch.name)}</span>
                    <span className="truncate text-[13.5px] font-medium">{ch.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className={cn("min-w-0 flex-1 flex-col bg-[#fbfcf9]", inThread && listOpen ? "hidden md:flex" : "flex")}>
          <header className="flex items-center gap-2 border-b border-[#eef1ea] bg-white/80 px-3 py-3 md:hidden">
            {inThread && !listOpen ? (
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f6f2]" onClick={() => setListOpen(true)} aria-label="Back">
                <IconBack className="h-5 w-5" />
              </button>
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1b6754] text-sm font-semibold text-white">A</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{activeChannel?.name ?? titleFor(pathname)}</p>
              <p className="truncate text-[11px] text-[#8b938d]">{displayName || "Collaborator"}</p>
            </div>
          </header>
          <div className={cn("min-h-0 flex-1", flush ? "flex flex-col overflow-hidden" : "ws-scroll overflow-auto p-4 pb-24 md:p-6 lg:pb-6")}>
            {flush ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 items-center rounded-[28px] border border-white/70 bg-white/90 p-1.5 shadow-[0_16px_40px_rgba(20,60,100,0.14)] backdrop-blur-xl lg:hidden">
        {NAV.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px]", item.match(pathname) ? "bg-[#efe8ff] font-medium text-[#7c5cfc]" : "text-[#8b938d]")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setCompose(true)} className="-mt-5 justify-self-center grid h-14 w-14 place-items-center rounded-full bg-[#1e2a24] text-2xl text-white shadow-lg" aria-label="Create">
          +
        </button>
        {NAV.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px]", item.match(pathname) ? "bg-[#efe8ff] font-medium text-[#7c5cfc]" : "text-[#8b938d]")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {compose ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-3 lg:place-items-center" onClick={() => setCompose(false)}>
          <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-[16px] font-semibold">Create</p>
            <div className="mt-4 grid gap-2">
              <Link href="/ws/meet" onClick={() => setCompose(false)} className="rounded-2xl bg-[#ead9ff] px-4 py-3 text-sm font-medium">
                New meeting
              </Link>
              <Link href="/ws/tasks" onClick={() => setCompose(false)} className="rounded-2xl bg-[#fff1c9] px-4 py-3 text-sm font-medium">
                New task
              </Link>
              <Link href={channels[0] ? `/ws/chat/${channels[0].id}` : "/ws/chat"} onClick={() => setCompose(false)} className="rounded-2xl bg-[#d9f5e8] px-4 py-3 text-sm font-medium">
                Open chat
              </Link>
            </div>
            <div className="mt-4 flex gap-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} className="h-11 flex-1 rounded-full bg-[#f6f3ff] px-4 text-sm outline-none" placeholder="Quick note" />
              <button type="button" onClick={() => void addNote()} className="rounded-full bg-[#7c5cfc] px-4 text-sm text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function initials(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "A";
}

function titleFor(pathname: string) {
  if (pathname.startsWith("/ws/meet")) return "Meetings";
  if (pathname.startsWith("/ws/tasks")) return "Tasks";
  if (pathname.startsWith("/ws/calendar")) return "Calendar";
  if (pathname === "/ws/chat") return "Messages";
  return "Workspace";
}
