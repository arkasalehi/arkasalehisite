import { listMeetings } from "@/lib/data/workspace";
import { MeetingList } from "@/components/workspace/MeetingList";

export const dynamic = "force-dynamic";

export default async function MeetPage() {
  const meetings = await listMeetings();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">جلسه و تماس ویدیو</h1>
      <MeetingList meetings={meetings} />
    </div>
  );
}
