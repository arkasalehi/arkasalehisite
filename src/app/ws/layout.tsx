import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getActiveTenantId, listChannels, listCollaboratorDirectory, listInbox, listMeetings, listNotes, listProjects, listTasks, listTenants } from "@/lib/data/workspace";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace",
};

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const [channels, inbox, people, tasks, notes, meetings, tenants, projects, activeTenantId] = await Promise.all([
    listChannels(session?.id).catch(() => []),
    listInbox(session?.id).catch(() => []),
    listCollaboratorDirectory().catch(() => []),
    listTasks().catch(() => []),
    listNotes().catch(() => []),
    listMeetings().catch(() => []),
    listTenants(session?.id).catch(() => []),
    listProjects().catch(() => []),
    getActiveTenantId().catch(() => null),
  ]);
  return (
    <WorkspaceShell
      displayName={session?.displayName ?? ""}
      role={session?.role ?? "collaborator"}
      avatarUrl={session?.avatarUrl ?? null}
      channels={channels}
      inbox={inbox}
      people={people}
      userId={session?.id ?? ""}
      tasks={tasks}
      notes={notes}
      meetings={meetings}
      tenants={tenants}
      activeTenantId={activeTenantId}
      projects={projects}
    >
      {children}
    </WorkspaceShell>
  );
}
