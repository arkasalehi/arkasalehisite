import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canJoinStudioMeeting, getStudioMeeting, listStudioProjects } from "@/lib/data/studio";
import { OfficeDesk } from "@/components/workspace/OfficeDesk";
import { RoomGate } from "@/components/workspace/RoomGate";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const done = routeTimer("page /ws/meet/[id]");
  const { id } = await params;
  const session = await getSession();
  const meeting = await getStudioMeeting(id);
  if (!meeting || !session) notFound();
  const allowed = await canJoinStudioMeeting(id);
  if (!allowed) {
    done();
    return <RoomGate meeting={meeting} userId={session.id} />;
  }
  const projects = await listStudioProjects(session.id, session.role).catch(() => []);
  const project = projects.find((item) => item.id === meeting.projectId || item.meetingId === meeting.id) ?? null;
  done();
  return (
    <OfficeDesk
      roomName={meeting.roomName}
      title={meeting.title}
      meetingId={meeting.id}
      projects={projects}
      lockedProjectId={project?.id ?? meeting.projectId}
      boardBody={project?.boardBody ?? ""}
      projectStatus={project?.status ?? "active"}
      userId={session.id}
      displayName={session.displayName}
      avatarUrl={session.avatarUrl}
      role={session.role}
    />
  );
}
