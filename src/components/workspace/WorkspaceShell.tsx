"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { publicSiteUrl } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNote, WorkspaceProject, WorkspaceTask, WorkspaceTenant } from "@/lib/data/workspace";
import { HulyNavigator } from "@/components/workspace/HulyNavigator";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { WsNotifications } from "@/components/workspace/WsNotifications";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";
import {
  IconCall,
  IconCal,
  IconChat,
  IconDoc,
  IconGrid,
  IconSettings,
  IconTasks,
} from "@/components/workspace/ws-icons";

type Person = { id: string; displayName: string; avatarUrl: string | null };

const APPS = [
  { href: "/ws", key: "inbox" as const, icon: IconGrid, match: (p: string) => p === "/ws" },
  { href: "/ws/tasks", key: "tracker" as const, icon: IconTasks, match: (p: string) => p.startsWith("/ws/tasks") },
  { href: "/ws/chat", key: "chat" as const, icon: IconChat, match: (p: string) => p.startsWith("/ws/chat") },
  { href: "/ws/docs", key: "documents" as const, icon: IconDoc, match: (p: string) => p.startsWith("/ws/docs") },
  { href: "/ws/meet", key: "office" as const, icon: IconCall, match: (p: string) => p.startsWith("/ws/meet") },
  { href: "/ws/calendar", key: "calendar" as const, icon: IconCal, match: (p: string) => p.startsWith("/ws/calendar") },
];

export function WorkspaceShell({
  children,
  displayName,
  channels,
  inbox,
  people = [],
  userId = "",
  tasks,
  notes,
  meetings,
  tenants = [],
  activeTenantId = null,
  projects = [],
}: {
  children: React.ReactNode;
  displayName: string;
  channels: Array<{ id: string; slug: string; name: string; kind?: string }>;
  inbox: InboxItem[];
  people?: Person[];
  userId?: string;
  tasks: WorkspaceTask[];
  notes: WorkspaceNote[];
  meetings: WorkspaceMeeting[];
  tenants?: WorkspaceTenant[];
  activeTenantId?: string | null;
  projects?: WorkspaceProject[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const site = publicSiteUrl();
  const [navOpen, setNavOpen] = useState(true);
  const [locale, setLocale] = useState<WsLocale>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [invite, setInvite] = useState("");
  const inRoom = pathname.startsWith("/ws/meet/");
  const t = wsCopy(locale);

  useEffect(() => {
    setLocale(localStorage.getItem("ws-locale") === "fa" ? "fa" : "en");
    setTheme(localStorage.getItem("ws-theme") === "light" ? "light" : "dark");
  }, []);

  function persistLocale(next: WsLocale) {
    setLocale(next);
    localStorage.setItem("ws-locale", next);
  }

  function persistTheme(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("ws-theme", next);
  }

  async function switchTenant(id: string) {
    await fetch("/api/workspace/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ switchTo: id }),
    });
    router.refresh();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!invite.trim()) return;
    await fetch("/api/workspace/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteEmail: invite.trim() }),
    });
    setInvite("");
  }

  return (
    <div className={cn("ws-app flex h-svh min-h-0 overflow-hidden", theme === "light" && "ws-theme-light")} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
      <CommandPalette channels={channels} tasks={tasks} notes={notes} meetings={meetings} />
      <nav className="hidden h-full w-[var(--app-panel-width)] shrink-0 flex-col items-center border-r border-[var(--theme-navpanel-icons-divider)] bg-[var(--theme-back-color)] py-2 lg:flex">
        <Link href="/ws" className="grid h-9 w-9 place-items-center rounded-md bg-[#3364e2] text-[13px] font-bold text-white" aria-label="Arka">
          A
        </Link>
        <div className="mt-3 flex flex-1 flex-col items-center gap-1">
          {APPS.map((app) => {
            const Icon = app.icon;
            const on = app.match(pathname);
            const notify = app.href === "/ws/chat" && inbox.some((i) => i.unread);
            return (
              <Link
                key={app.href}
                href={app.href}
                title={t[app.key]}
                className={cn(
                  "relative grid h-9 w-9 place-items-center rounded-md",
                  on ? "bg-[var(--theme-navpanel-selected)] text-white" : "text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)] hover:text-white",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {notify ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#3364e2]" /> : null}
              </Link>
            );
          })}
        </div>
        <a href={site} title="Settings" className="grid h-9 w-9 place-items-center rounded-md text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)]">
          <IconSettings className="h-[18px] w-[18px]" />
        </a>
      </nav>

      {navOpen && !inRoom ? (
        <aside className="hidden h-full w-[240px] shrink-0 border-r border-[var(--theme-divider-color)] md:flex">
          <Suspense fallback={null}>
            <HulyNavigator channels={channels} inbox={inbox} tasks={tasks} notes={notes} meetings={meetings} projects={projects} people={people.filter((p) => p.id !== userId)} locale={locale} />
          </Suspense>
        </aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-color)]">
        <header className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] px-3">
          <button type="button" className="grid h-7 w-7 place-items-center rounded text-[var(--theme-dark-color)] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle navigator">
            ☰
          </button>
          <p className="min-w-0 truncate text-[13px] font-medium text-[var(--theme-caption-color)]">{titleFor(pathname, t)}</p>
          {tenants.length ? (
            <select className="h-7 max-w-[140px] rounded bg-[var(--input-BackgroundColor)] px-1 text-[12px]" value={activeTenantId ?? tenants[0]?.id} onChange={(e) => void switchTenant(e.target.value)}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : null}
          <form onSubmit={(e) => void sendInvite(e)} className="hidden items-center gap-1 md:flex">
            <input value={invite} onChange={(e) => setInvite(e.target.value)} className="h-7 w-36 rounded bg-[var(--input-BackgroundColor)] px-2 text-[12px] outline-none" placeholder="invite@email" />
            <button type="submit" className="text-[11px] text-[var(--theme-link-color)]">
              {t.invite}
            </button>
          </form>
          <button type="button" className="hidden h-7 rounded px-2 text-[12px] text-[var(--theme-darker-color)] hover:bg-[var(--theme-navpanel-hovered)] md:inline" onClick={() => window.dispatchEvent(new Event("ws:command"))}>
            {t.search}
          </button>
          <button type="button" className="h-7 rounded px-2 text-[11px] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => persistLocale(locale === "en" ? "fa" : "en")}>
            {locale === "en" ? "FA" : "EN"}
          </button>
          <button type="button" className="h-7 rounded px-2 text-[11px] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => persistTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t.light : t.dark}
          </button>
          <WsNotifications />
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#205dc2] text-[10px] font-semibold">
            {(displayName || "A").slice(0, 1).toUpperCase()}
          </span>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--theme-divider-color)] bg-[var(--theme-back-color)] lg:hidden">
        {APPS.slice(0, 4).map((app) => {
          const Icon = app.icon;
          return (
            <Link key={app.href} href={app.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", app.match(pathname) ? "text-white" : "text-[var(--theme-navpanel-icons-color)]")}>
              <Icon className="h-4 w-4" />
              {t[app.key]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function titleFor(pathname: string, t: ReturnType<typeof wsCopy>) {
  if (pathname.startsWith("/ws/meet")) return t.office;
  if (pathname.startsWith("/ws/tasks")) return t.tracker;
  if (pathname.startsWith("/ws/calendar")) return t.calendar;
  if (pathname.startsWith("/ws/chat")) return t.chat;
  if (pathname.startsWith("/ws/docs")) return t.documents;
  return t.inbox;
}
