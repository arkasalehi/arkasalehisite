"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Calendar, Folder, Inbox, ListFilter, Menu, MessageSquare, Moon, PanelLeft, Search, Smartphone, Sun, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxItem, WorkspaceMeeting, WorkspaceNavNote, WorkspaceNavTask, WorkspaceProject, WorkspaceTenant } from "@/lib/data/workspace";
import { HulyNavigator } from "@/components/workspace/HulyNavigator";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { WsNotifications } from "@/components/workspace/WsNotifications";
import { WsProfileSheet } from "@/components/workspace/WsProfileSheet";
import { setWsLocale, setWsTheme, useWsChrome, WsChromeProvider } from "@/lib/theme/workspace";

type Person = { id: string; displayName: string; avatarUrl: string | null };

const APPS = [
  { href: "/ws", key: "inbox" as const, icon: Inbox, match: (p: string) => p === "/ws" || p.startsWith("/ws/inbox") },
  { href: "/ws/tasks", key: "tasksNav" as const, icon: ListFilter, match: (p: string) => p.startsWith("/ws/tasks") },
  { href: "/ws/docs", key: "docNav" as const, icon: Folder, match: (p: string) => p.startsWith("/ws/docs") },
  { href: "/ws/chat", key: "chat" as const, icon: MessageSquare, match: (p: string) => p.startsWith("/ws/chat") },
  { href: "/ws/meet", key: "office" as const, icon: Smartphone, match: (p: string) => p.startsWith("/ws/meet") },
  { href: "/ws/calendar", key: "calendar" as const, icon: Calendar, match: (p: string) => p.startsWith("/ws/calendar") },
  { href: "/ws/people", key: "people" as const, icon: Users, match: (p: string) => p.startsWith("/ws/people") },
];

const DOCK = APPS.slice(0, 5);

export function WorkspaceShell(props: {
  children: React.ReactNode;
  displayName: string;
  username?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
  channels: Array<{ id: string; slug: string; name: string; kind?: string }>;
  inbox: InboxItem[];
  people?: Person[];
  userId?: string;
  tasks: WorkspaceNavTask[];
  notes: WorkspaceNavNote[];
  meetings: WorkspaceMeeting[];
  tenants?: WorkspaceTenant[];
  activeTenantId?: string | null;
  projects?: WorkspaceProject[];
  initialTheme?: "dark" | "light";
  initialLocale?: "en" | "fa";
}) {
  return (
    <WsChromeProvider initialTheme={props.initialTheme ?? "dark"} initialLocale={props.initialLocale ?? "fa"}>
      <WorkspaceShellInner {...props} />
    </WsChromeProvider>
  );
}

function WorkspaceShellInner({
  children,
  displayName,
  username = "",
  email = "",
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
  username?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
  channels: Array<{ id: string; slug: string; name: string; kind?: string }>;
  inbox: InboxItem[];
  people?: Person[];
  userId?: string;
  tasks: WorkspaceNavTask[];
  notes: WorkspaceNavNote[];
  meetings: WorkspaceMeeting[];
  tenants?: WorkspaceTenant[];
  activeTenantId?: string | null;
  projects?: WorkspaceProject[];
  initialTheme?: "dark" | "light";
  initialLocale?: "en" | "fa";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, locale, t } = useWsChrome();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [profile, setProfile] = useState<{ displayName: string; username: string; avatarUrl: string | null } | null>(null);
  const [profileKey, setProfileKey] = useState(`${displayName}|${username}|${avatarUrl ?? ""}`);
  const nextKey = `${displayName}|${username}|${avatarUrl ?? ""}`;
  if (nextKey !== profileKey) {
    setProfileKey(nextKey);
    setProfile(null);
  }
  const liveName = profile?.displayName ?? displayName;
  const liveUser = profile?.username ?? username;
  const liveAvatar = profile?.avatarUrl ?? avatarUrl;
  const collapsed = useSyncExternalStore(subscribeSidebar, readSidebarCollapsed, () => false);
  const inCall = pathname.startsWith("/ws/meet/");
  const showNavigator = pathname.startsWith("/ws/chat/");
  const roleLabel = role === "admin" ? t.admin : role === "collaborator" ? t.collaborator : t.member;

  function toggleCollapsed() {
    const next = !readSidebarCollapsed();
    window.localStorage.setItem("ws-sidebar", next ? "collapsed" : "expanded");
    window.dispatchEvent(new Event("ws-sidebar"));
  }

  const crumbs = APPS.find((app) => app.match(pathname));

  useEffect(() => {
    void fetch("/api/workspace/presence", { method: "POST" });
    const id = window.setInterval(() => {
      void fetch("/api/workspace/presence", { method: "POST" });
    }, 45_000);
    return () => window.clearInterval(id);
  }, []);

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
    <div className={cn("ws-app relative h-full min-h-0 overflow-hidden", theme === "light" && "ws-theme-light")} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale} suppressHydrationWarning>
      <div className="flex h-full min-h-0 overflow-hidden">
      <CommandPalette channels={channels} tasks={tasks} notes={notes} meetings={meetings} />
      {!inCall ? (
        <>
          {mobileNav ? <button type="button" className="fixed inset-0 z-30 bg-black/50 lg:hidden" aria-label="بستن منو" onClick={() => setMobileNav(false)} /> : null}
          <nav
            className={cn(
              "z-40 h-full shrink-0 flex-col border-e border-[var(--theme-navpanel-icons-divider)] bg-[var(--theme-back-color)] py-3",
              mobileNav ? "fixed inset-y-0 start-0 flex w-[240px] shadow-2xl" : "hidden lg:flex",
              collapsed ? "lg:w-14" : "lg:w-[220px]",
            )}
            aria-label="Workspace"
          >
            <div className={cn("mb-3 flex items-center gap-2 px-3", collapsed && "lg:justify-center lg:px-0")}>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--ws-accent)] text-[13px] font-semibold text-[var(--ws-on-accent)]">آ</span>
              <span className={cn("truncate text-[13px] font-semibold", collapsed && "lg:hidden")}>{t.workspace}</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5 px-2">
              {APPS.map((app) => {
                const Icon = app.icon;
                const on = app.match(pathname);
                const notify = app.href === "/ws/chat" && inbox.some((i) => i.unread);
                return (
                  <Link
                    key={app.href}
                    href={app.href}
                    title={t[app.key]}
                    aria-current={on ? "page" : undefined}
                    onClick={() => setMobileNav(false)}
                    className={cn(
                      "ws-sidebar-link relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)] hover:text-[var(--theme-caption-color)]",
                      collapsed && "lg:justify-center lg:px-0",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={on ? 2 : 1.75} />
                    <span className={cn("truncate", collapsed && "lg:hidden")}>{t[app.key]}</span>
                    {notify ? <span className="absolute end-2 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              className="mx-2 mt-2 hidden h-8 items-center gap-2 rounded-md px-2 text-[12px] text-[var(--theme-darker-color)] hover:bg-[var(--theme-navpanel-hovered)] lg:flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "باز کردن نوار" : "جمع کردن نوار"}
            >
              <PanelLeft className="h-4 w-4" />
              <span className={cn(collapsed && "lg:hidden")}>{collapsed ? "" : locale === "fa" ? "جمع کردن" : "Collapse"}</span>
            </button>
          </nav>
        </>
      ) : null}

      {showNavigator && !inCall ? <aside className="hidden h-full w-[240px] shrink-0 border-e border-[var(--theme-divider-color)] md:flex">{navigator}</aside> : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--theme-bg-color)]">
        {!inCall ? (
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--theme-divider-color)] bg-[var(--theme-bg-color)] px-3">
          <button type="button" className="ws-icon-btn lg:hidden" aria-label="منو" onClick={() => setMobileNav((v) => !v)}>
            {mobileNav ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] text-[var(--theme-darker-color)] sm:flex" aria-label="مسیر">
            <span className="truncate">{tenants.find((tenant) => tenant.id === activeTenantId)?.name || t.workspace}</span>
            <span aria-hidden>/</span>
            <span className="truncate text-[var(--theme-caption-color)]">{crumbs ? t[crumbs.key] : t.workspace}</span>
          </nav>
          <button
            type="button"
            className="ms-auto hidden h-8 min-w-[200px] items-center gap-2 rounded-md border border-[var(--theme-divider-color)] px-2 text-[12px] text-[var(--theme-darker-color)] hover:border-[var(--theme-content-color)] md:flex"
            onClick={() => window.dispatchEvent(new Event("ws:command"))}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-start">{t.search}</span>
            <kbd className="font-mono text-[10px]">⌘K</kbd>
          </button>
          <button type="button" className="ws-icon-btn ms-auto md:hidden" onClick={() => window.dispatchEvent(new Event("ws:command"))} aria-label={t.search}>
            <Search className="h-4 w-4" />
          </button>
          <button type="button" className="flex min-w-0 items-center gap-2 text-start" onClick={() => setProfileOpen(true)}>
            {liveAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={liveAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--theme-navpanel-hovered)] text-[11px] font-semibold text-[var(--theme-caption-color)]">{(liveName || "A").slice(0, 1).toUpperCase()}</span>
            )}
            <span className="hidden max-w-[120px] truncate text-[12px] text-[var(--theme-caption-color)] sm:inline">{liveName || roleLabel}</span>
          </button>
          {tenants.length > 1 ? (
            <select className="hidden max-w-[120px] bg-transparent text-[12px] text-[var(--theme-darker-color)] sm:block" value={activeTenantId ?? tenants[0]?.id} onChange={(e) => void switchTenant(e.target.value)}>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="ws-icon-btn"
            onClick={() => setWsTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? t.lightMode : t.darkMode}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" strokeWidth={1.75} /> : <Moon className="h-5 w-5" strokeWidth={1.75} />}
          </button>
          <WsNotifications />
        </header>
        ) : null}
        <WsProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          displayName={liveName}
          username={liveUser}
          email={email}
          role={role}
          avatarUrl={liveAvatar}
          tenants={tenants}
          activeTenantId={activeTenantId}
          locale={locale}
          theme={theme}
          onLocale={(next) => {
            setWsLocale(next);
            router.refresh();
          }}
          onProfile={(next) => {
            setProfile({ displayName: next.displayName, username: next.username, avatarUrl: next.avatarUrl });
          }}
        />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
      </div>

      {!inCall ? <MobileDock pathname={pathname} t={t} /> : null}
    </div>
  );
}

function subscribeSidebar(onChange: () => void) {
  window.addEventListener("ws-sidebar", onChange);
  return () => window.removeEventListener("ws-sidebar", onChange);
}

function readSidebarCollapsed() {
  return window.localStorage.getItem("ws-sidebar") === "collapsed";
}

function MobileDock({
  pathname,
  t,
}: {
  pathname: string;
  t: ReturnType<typeof useWsChrome>["t"];
}) {
  const host = useSyncExternalStore(
    () => () => {},
    () => document.body,
    () => null,
  );

  const nav = (
    <nav className="ws-dock lg:hidden" aria-label="Workspace">
      <span className="ws-dock-frost" aria-hidden />
      <div className="ws-dock-items">
      {DOCK.map((app) => {
        const Icon = app.icon;
        const on = app.match(pathname);
        return (
          <Link key={app.href} href={app.href} aria-current={on ? "page" : undefined} aria-label={t[app.key]} className="ws-dock-item">
            <Icon className="h-6 w-6" strokeWidth={on ? 2.15 : 1.75} />
            <span className="w-full truncate text-center">{t[app.key]}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );

  if (!host) return null;
  return createPortal(nav, host);
}
