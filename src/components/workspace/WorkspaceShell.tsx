"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CalendarDays, FileText, Inbox, ListTodo, MessageSquare, PanelLeft, Search, Settings, Video } from "lucide-react";
import { publicSiteUrl } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNote, WorkspaceProject, WorkspaceTask, WorkspaceTenant } from "@/lib/data/workspace";
import { HulyNavigator } from "@/components/workspace/HulyNavigator";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { WsNotifications } from "@/components/workspace/WsNotifications";
import { ArkaMark } from "@/components/workspace/ArkaMark";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";

type Person = { id: string; displayName: string; avatarUrl: string | null };

const APPS = [
  { href: "/ws", key: "inbox" as const, icon: Inbox, match: (p: string) => p === "/ws" },
  { href: "/ws/tasks", key: "tracker" as const, icon: ListTodo, match: (p: string) => p.startsWith("/ws/tasks") },
  { href: "/ws/chat", key: "chat" as const, icon: MessageSquare, match: (p: string) => p.startsWith("/ws/chat") },
  { href: "/ws/docs", key: "documents" as const, icon: FileText, match: (p: string) => p.startsWith("/ws/docs") },
  { href: "/ws/meet", key: "office" as const, icon: Video, match: (p: string) => p.startsWith("/ws/meet") },
  { href: "/ws/calendar", key: "calendar" as const, icon: CalendarDays, match: (p: string) => p.startsWith("/ws/calendar") },
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
  const site = publicSiteUrl(typeof window !== "undefined" ? window.location.host : undefined);
  const [navOpen, setNavOpen] = useState(false);
  const [locale, setLocale] = useState<WsLocale>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [invite, setInvite] = useState("");
  const [inviting, setInviting] = useState(false);
  const inRoom = pathname.startsWith("/ws/meet/");
  const t = wsCopy(locale);

  useEffect(() => {
    const nextLocale = localStorage.getItem("ws-locale") === "fa" ? "fa" : "en";
    const nextTheme = localStorage.getItem("ws-theme") === "light" ? "light" : "dark";
    setLocale(nextLocale);
    setTheme(nextTheme);
    applyDocumentDir(nextLocale);
    setNavOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setNavOpen(false);
  }, [pathname]);

  function persistLocale(next: WsLocale) {
    setLocale(next);
    localStorage.setItem("ws-locale", next);
    applyDocumentDir(next);
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
    setInviting(true);
    await fetch("/api/workspace/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteEmail: invite.trim() }),
    });
    setInvite("");
    setInviting(false);
  }

  const navigator = (
    <Suspense fallback={null}>
      <HulyNavigator channels={channels} inbox={inbox} tasks={tasks} notes={notes} meetings={meetings} projects={projects} people={people.filter((p) => p.id !== userId)} locale={locale} />
    </Suspense>
  );

  return (
    <div className={cn("ws-app flex h-svh min-h-0 overflow-hidden", theme === "light" && "ws-theme-light")} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
      <CommandPalette channels={channels} tasks={tasks} notes={notes} meetings={meetings} />
      <nav className="hidden h-full w-[var(--app-panel-width)] shrink-0 flex-col items-center border-e border-[var(--theme-navpanel-icons-divider)] bg-[var(--theme-back-color)] py-[var(--ws-space-2)] lg:flex">
        <Link href="/ws" className="rounded-[var(--ws-radius)]" aria-label="Arka">
          <ArkaMark />
        </Link>
        <div className="mt-[var(--ws-space-4)] flex flex-1 flex-col items-center gap-[var(--ws-space-1)]">
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
                  "relative grid h-9 w-9 place-items-center rounded-[var(--ws-radius)]",
                  on ? "bg-[var(--theme-navpanel-selected)] text-[var(--ws-accent)]" : "text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)] hover:text-[var(--theme-caption-color)]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {notify ? <span className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
              </Link>
            );
          })}
        </div>
        <a href={site} title="Settings" className="grid h-9 w-9 place-items-center rounded-[var(--ws-radius)] text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)] hover:text-[var(--theme-caption-color)]">
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </a>
      </nav>

      {navOpen && !inRoom ? (
        <aside className="hidden h-full w-[240px] shrink-0 border-e border-[var(--theme-divider-color)] md:flex">{navigator}</aside>
      ) : null}

      {navOpen && !inRoom ? (
        <div className="md:hidden">
          <button type="button" className="fixed inset-0 z-40 bg-black/50" aria-label="Close navigator" onClick={() => setNavOpen(false)} />
          <aside className="fixed inset-y-0 start-0 z-50 flex w-[min(280px,88vw)] border-e border-[var(--theme-divider-color)] bg-[var(--theme-navpanel-color)] pt-10">{navigator}</aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-color)]">
        <header className="flex h-10 shrink-0 items-center gap-[var(--ws-space-1)] overflow-hidden border-b border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] px-[var(--ws-space-2)] sm:gap-[var(--ws-space-2)] sm:px-[var(--ws-space-3)]">
          <button type="button" className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--ws-radius)] text-[var(--theme-dark-color)] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setNavOpen((v) => !v)} aria-label="Toggle navigator">
            <PanelLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.75} />
          </button>
          <p className="min-w-0 truncate text-[length:var(--ws-type-sm)] font-medium tracking-[var(--ws-tracking-heading)]">{titleFor(pathname, t)}</p>
          {tenants.length ? (
            <select className="ws-input hidden max-w-[140px] text-[length:var(--ws-type-xs)] sm:block" value={activeTenantId ?? tenants[0]?.id} onChange={(e) => void switchTenant(e.target.value)}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : null}
          <form onSubmit={(e) => void sendInvite(e)} className="ms-auto hidden items-center gap-[var(--ws-space-1)] lg:flex">
            <input value={invite} onChange={(e) => setInvite(e.target.value)} className="ws-input w-36 text-[length:var(--ws-type-xs)]" placeholder="invite@email" />
            <button type="submit" className="ws-btn ws-btn-ghost text-[var(--ws-accent)]" disabled={inviting}>
              {inviting ? <span className="ws-spinner" /> : t.invite}
            </button>
          </form>
          <button type="button" className="ws-btn ws-btn-ghost ms-auto hidden text-[var(--theme-darker-color)] md:inline-flex lg:ms-0" onClick={() => window.dispatchEvent(new Event("ws:command"))}>
            <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="hidden lg:inline">{t.search}</span>
          </button>
          <button type="button" className="ws-btn ws-btn-ghost shrink-0 text-[length:var(--ws-type-xs)] md:ms-0" onClick={() => persistLocale(locale === "en" ? "fa" : "en")}>
            {locale === "en" ? "FA" : "EN"}
          </button>
          <button type="button" className="ws-btn ws-btn-ghost hidden shrink-0 text-[length:var(--ws-type-xs)] sm:inline-flex" onClick={() => persistTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? t.light : t.dark}
          </button>
          <WsNotifications />
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--ws-gray-4)] text-[10px] font-semibold">
            {(displayName || "A").slice(0, 1).toUpperCase()}
          </span>
        </header>
        <div className={cn("min-h-0 flex-1 overflow-hidden", !inRoom && "pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0")}>{children}</div>
      </div>

      {!inRoom ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-[var(--theme-divider-color)] bg-[var(--theme-back-color)] pb-[env(safe-area-inset-bottom)] lg:hidden">
          {APPS.map((app) => {
            const Icon = app.icon;
            return (
              <Link key={app.href} href={app.href} className={cn("flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 text-[9px] leading-none", app.match(pathname) ? "text-[var(--ws-accent)]" : "text-[var(--theme-navpanel-icons-color)]")}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="w-full truncate text-center">{t[app.key]}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

function applyDocumentDir(locale: WsLocale) {
  document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  document.documentElement.lang = locale;
}

function titleFor(pathname: string, t: ReturnType<typeof wsCopy>) {
  if (pathname.startsWith("/ws/meet")) return t.office;
  if (pathname.startsWith("/ws/tasks")) return t.tracker;
  if (pathname.startsWith("/ws/calendar")) return t.calendar;
  if (pathname.startsWith("/ws/chat")) return t.chat;
  if (pathname.startsWith("/ws/docs")) return t.documents;
  return t.inbox;
}
