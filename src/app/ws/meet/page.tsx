import { getSession } from "@/lib/auth/session";
import { listMeetings } from "@/lib/data/workspace";
import { MeetingList } from "@/components/workspace/MeetingList";

export const dynamic = "force-dynamic";

export default async function MeetPage() {
  const meetings = await listMeetings().catch(() => []);
  return <MeetingList meetings={meetings} />;
}
