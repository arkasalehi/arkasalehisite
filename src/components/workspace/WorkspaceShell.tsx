"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Archive, Folder, Inbox, ListFilter, MessageSquare, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNote, WorkspaceProject, WorkspaceTask, WorkspaceTenant } from "@/lib/data/workspace";
import { HulyNavigator } from "@/components/workspace/HulyNavigator";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { WsNotifications } from "@/components/workspace/WsNotifications";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";

type Person = { id: string; displayName: string; avatarUrl: string | null };

const APPS = [
  { href: "/ws", key: "inbox" as const, icon: Inbox, match: (p: string) => p === "/ws" || p.startsWith("/ws/inbox") },
  { href: "/ws/tasks", key: "tasksNav" as const, icon: ListFilter, match: (p: string) => p.startsWith("/ws/tasks") },
  { href: "/ws/docs", key: "docNav" as const, icon: Folder, match: (p: string) => p.startsWith("/ws/docs") },
  { href: "/ws/chat", key: "chat" as const, icon: MessageSquare, match: (p: string) => p.startsWith("/ws/chat") },
  { href: "/ws/meet", key: "office" as const, icon: Smartphone, match: (p: string) => p.startsWith("/ws/meet") },
];

export function WorkspaceShell({
  children,
  displayName,
  role = "collaborator",
  avatarUrl = null,
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
  role?: string;
  avatarUrl?: string | null;
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
  const [navOpen, setNavOpen] = useState(false);
  const [locale, setLocale] = useState<WsLocale>("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const officeHub = pathname === "/ws/meet";
  const inCall = pathname.startsWith("/ws/meet/");
  const t = wsCopy(locale);
  const roleLabel = role === "admin" ? "Admin" : role === "collaborator" ? "Collaborator" : "Member";

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

  async function switchTenant(id: string) {
    await fetch("/api/workspace/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ switchTo: id }),
    });
    router.refresh();
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
        <div className="mt-[var(--ws-space-2)] flex flex-1 flex-col items-center gap-[var(--ws-space-1)]">
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
      </nav>

      {navOpen && !officeHub && !inCall ? (
        <aside className="hidden h-full w-[240px] shrink-0 border-e border-[var(--theme-divider-color)] md:flex">{navigator}</aside>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col bg-[var(--theme-bg-color)]">
        <header dir="ltr" className="flex h-14 shrink-0 items-center gap-3 border-b border-white/6 bg-[#12151a] px-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2a3140] text-sm font-semibold">{(displayName || "A").slice(0, 1).toUpperCase()}</span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-semibold text-white">{displayName || "Studio"}</p>
            <p className="text-[12px] text-white/45">{roleLabel}</p>
          </div>
          {tenants.length > 1 ? (
            <select className="hidden max-w-[120px] bg-transparent text-[12px] text-white/45 sm:block" value={activeTenantId ?? tenants[0]?.id} onChange={(e) => void switchTenant(e.target.value)}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1c2128] text-white/80" onClick={() => window.dispatchEvent(new Event("ws:command"))} aria-label="Projects">
            <Archive className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <WsNotifications />
        </header>
        <div className={cn("min-h-0 flex-1 overflow-hidden", !inCall && "pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0")}>{children}</div>
      </div>

      {!inCall ? (
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/6 bg-[#0c0e12] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {APPS.map((app) => {
          const Icon = app.icon;
          const on = app.match(pathname);
          return (
            <Link key={app.href} href={app.href} className={cn("flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-[11px] leading-none", on ? "text-white" : "text-white/40")}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={on ? 2 : 1.75} />
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
