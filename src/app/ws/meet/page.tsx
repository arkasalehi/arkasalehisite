import { getSession } from "@/lib/auth/session";
import { listNotes, listProjects, listTasks } from "@/lib/data/workspace";
import { OfficeDesk } from "@/components/workspace/OfficeDesk";

export const dynamic = "force-dynamic";

export default async function MeetPage() {
  const session = await getSession();
  const [projects, tasks, notes] = await Promise.all([listProjects().catch(() => []), listTasks().catch(() => []), listNotes().catch(() => [])]);
  return (
    <OfficeDesk
      projects={projects}
      tasks={tasks}
      notes={notes}
      userId={session?.id ?? ""}
      displayName={session?.displayName ?? "Teammate"}
      avatarUrl={session?.avatarUrl ?? null}
      role={session?.role ?? "collaborator"}
    />
  );
}
