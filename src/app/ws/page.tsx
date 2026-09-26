import { getSession } from "@/lib/auth/session";
import { listCollaboratorDirectory } from "@/lib/data/workspace";
import { listStudioEvents, listStudioPeople, listStudioProjects } from "@/lib/data/studio";
import { ProjectInbox } from "@/components/workspace/ProjectInbox";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const done = routeTimer("page /ws");
  const session = await getSession();
  const [projects, people, team, events] = await Promise.all([
    listStudioProjects(session?.id ?? "", session?.role ?? "collaborator").catch(() => []),
    listCollaboratorDirectory().catch(() => []),
    listStudioPeople().catch(() => []),
    listStudioEvents().catch(() => []),
  ]);
  done();
  return (
    <ProjectInbox
      projects={projects}
      people={people}
      team={team}
      events={events}
      userId={session?.id ?? ""}
      role={session?.role ?? "collaborator"}
    />
  );
}
