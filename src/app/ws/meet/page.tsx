import { getSession } from "@/lib/auth/session";
import { listCollaboratorDirectory } from "@/lib/data/workspace";
import { listStudioProjects, listStudioRooms, type StudioRoom } from "@/lib/data/studio";
import { OfficeHub } from "@/components/workspace/OfficeHub";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function MeetPage() {
  const done = routeTimer("page /ws/meet");
  const session = await getSession();
  const [rooms, projects, people] = await Promise.all([
    listStudioRooms().catch((): StudioRoom[] => []),
    listStudioProjects(session?.id ?? "", session?.role ?? "collaborator").catch(() => []),
    listCollaboratorDirectory().catch(() => []),
  ]);
  done();
  return <OfficeHub rooms={rooms} projects={projects} people={people} userId={session?.id ?? ""} role={session?.role ?? "collaborator"} />;
}
