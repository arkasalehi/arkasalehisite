import { listMeetings } from "@/lib/data/workspace";
import { MeetingList } from "@/components/workspace/MeetingList";

export const dynamic = "force-dynamic";

export default async function MeetPage() {
  const meetings = await listMeetings();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-[22px] font-semibold tracking-tight">Meetings & video</h1>
      <MeetingList meetings={meetings} />
    </div>
  );
}
