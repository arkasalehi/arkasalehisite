import { getSession } from "@/lib/auth/session";
import { listInbox, listMeetings, listTasks } from "@/lib/data/workspace";
import { InboxFeed } from "@/components/workspace/InboxFeed";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const session = await getSession();
  const [meetings, tasks, inbox] = await Promise.all([
    listMeetings(),
    listTasks(),
    listInbox(session?.id).catch(() => []),
  ]);
  return <InboxFeed tasks={tasks} inbox={inbox} meetings={meetings} />;
}
