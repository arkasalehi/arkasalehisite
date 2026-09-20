import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMeeting } from "@/lib/data/workspace";
import { MeetingStage } from "@/components/workspace/MeetingStage";

export const dynamic = "force-dynamic";

export default async function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const meeting = await getMeeting(id);
  if (!meeting || !session) notFound();
  return (
    <MeetingStage
      title={meeting.title}
      subtitle={new Date(meeting.startsAt).toLocaleString("en-US")}
      roomName={meeting.roomName}
      displayName={session.displayName}
    />
  );
}
