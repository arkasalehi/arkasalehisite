import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getMeeting } from "@/lib/data/workspace";
import { JitsiRoom } from "@/components/workspace/JitsiRoom";

export const dynamic = "force-dynamic";

export default async function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const meeting = await getMeeting(id);
  if (!meeting || !session) notFound();
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold">{meeting.title}</h1>
        <p className="text-xs text-[#8b938d]">{new Date(meeting.startsAt).toLocaleString("fa-IR")}</p>
      </div>
      <JitsiRoom roomName={meeting.roomName} displayName={session.displayName} />
    </div>
  );
}
