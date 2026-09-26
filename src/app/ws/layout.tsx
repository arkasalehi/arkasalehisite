import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import {
  getActiveTenantId,
  listChannels,
  listInbox,
  listNavMeetings,
  listNavNotes,
  listNavTasks,
  listProjects,
  listTenants,
  listCollaboratorDirectory,
} from "@/lib/data/workspace";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { cookies } from "next/headers";
import { wsLocaleOrDefault, wsThemeOrDefault } from "@/lib/theme/prefs";
import { routeTimer } from "@/lib/timing";
import { ensurePersonalRoom } from "@/lib/data/studio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace",
};

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const done = routeTimer("layout /ws");
  const session = await getSession();
  const [channels, inbox, tasks, notes, meetings, tenants, projects, activeTenantId, people] = await Promise.all([
    listChannels(session?.id).catch(() => []),
    listInbox(session?.id).catch(() => []),
    listNavTasks().catch(() => []),
    listNavNotes().catch(() => []),
    listNavMeetings().catch(() => []),
    listTenants(session?.id).catch(() => []),
    listProjects().catch(() => []),
    getActiveTenantId().catch(() => null),
    listCollaboratorDirectory().catch(() => []),
  ]);
  if (session) await ensurePersonalRoom(session.id, session.displayName || session.username || "Room").catch(() => null);
  const jar = await cookies();
  const initialTheme = wsThemeOrDefault(jar.get("ws_theme")?.value);
  const initialLocale = wsLocaleOrDefault(jar.get("ws_locale")?.value);
  done();
  return (
    <WorkspaceShell
      displayName={session?.displayName ?? ""}
      username={session?.username ?? ""}
      email={session?.email ?? ""}
      role={session?.role ?? "collaborator"}
      avatarUrl={session?.avatarUrl ?? null}
      channels={channels}
      inbox={inbox}
      userId={session?.id ?? ""}
      tasks={tasks}
      notes={notes}
      meetings={meetings}
      tenants={tenants}
      activeTenantId={activeTenantId}
      projects={projects}
      people={people}
      initialTheme={initialTheme}
      initialLocale={initialLocale}
    >
      {children}
    </WorkspaceShell>
  );
}
