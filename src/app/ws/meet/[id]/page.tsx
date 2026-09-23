import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMeeting, listNotes, listProjects, listTasks } from "@/lib/data/workspace";
import { OfficeDesk } from "@/components/workspace/OfficeDesk";

export const dynamic = "force-dynamic";

export default async function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const meeting = await getMeeting(id);
  if (!meeting || !session) notFound();
  const [projects, tasks, notes] = await Promise.all([listProjects().catch(() => []), listTasks().catch(() => []), listNotes().catch(() => [])]);
  return (
    <OfficeDesk
      roomName={meeting.roomName}
      title={meeting.title}
      projects={projects}
      tasks={tasks}
      notes={notes}
      userId={session.id}
      displayName={session.displayName}
      avatarUrl={session.avatarUrl}
      role={session.role}
    />
  );
}
