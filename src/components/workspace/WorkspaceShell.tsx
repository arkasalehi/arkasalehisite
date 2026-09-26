"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Archive, Folder, Inbox, ListFilter, MessageSquare, Moon, Smartphone, Sun } from "lucide-react";
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
];

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
  const [liveName, setLiveName] = useState(displayName);
  const [liveUser, setLiveUser] = useState(username);
  const [liveAvatar, setLiveAvatar] = useState(avatarUrl);
  const inCall = pathname.startsWith("/ws/meet/");
  const showNavigator = pathname.startsWith("/ws/chat/");
  const roleLabel = role === "admin" ? t.admin : role === "collaborator" ? t.collaborator : t.member;

  useEffect(() => {
    setLiveName(displayName);
    setLiveUser(username);
    setLiveAvatar(avatarUrl);
  }, [displayName, username, avatarUrl]);

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
      {!inCall ? <nav className="hidden h-full w-[var(--app-panel-width)] shrink-0 flex-col items-center border-e border-[var(--theme-navpanel-icons-divider)] bg-[var(--theme-back-color)] py-[var(--ws-space-2)] lg:flex">
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
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative grid h-11 w-11 place-items-center rounded-[var(--ws-radius)]",
                  on ? "bg-[var(--ws-accent-muted)] text-[var(--ws-accent)]" : "text-[var(--theme-navpanel-icons-color)] hover:bg-[var(--theme-navpanel-hovered)] hover:text-[var(--theme-caption-color)]",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={on ? 2 : 1.75} />
                {notify ? <span className="absolute end-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--ws-accent)]" /> : null}
              </Link>
            );
          })}
        </div>
      </nav> : null}

      {showNavigator && !inCall ? <aside className="hidden h-full w-[240px] shrink-0 border-e border-[var(--theme-divider-color)] md:flex">{navigator}</aside> : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--theme-bg-color)]">
        {!inCall ? (
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] px-3">
          <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setProfileOpen(true)}>
            {liveAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={liveAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--theme-navpanel-hovered)] text-sm font-semibold text-[var(--theme-caption-color)]">{(liveName || "A").slice(0, 1).toUpperCase()}</span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[15px] font-semibold text-[var(--theme-caption-color)]">{liveName || t.workspace}</p>
              <p className="text-[12px] text-[var(--theme-darker-color)]">{roleLabel}</p>
            </div>
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
          <button type="button" className="ws-icon-btn" onClick={() => window.dispatchEvent(new Event("ws:command"))} aria-label={t.projects}>
            <Archive className="h-5 w-5" strokeWidth={1.75} />
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
            setLiveName(next.displayName);
            setLiveUser(next.username);
            setLiveAvatar(next.avatarUrl);
          }}
        />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
      </div>

      {!inCall ? <MobileDock pathname={pathname} t={t} /> : null}
    </div>
  );
}

function MobileDock({
  pathname,
  t,
}: {
  pathname: string;
  t: ReturnType<typeof useWsChrome>["t"];
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHost(document.body);
  }, []);

  const nav = (
    <nav className="ws-dock lg:hidden" aria-label="Workspace">
      <span className="ws-dock-frost" aria-hidden />
      <div className="ws-dock-items">
      {APPS.map((app) => {
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
