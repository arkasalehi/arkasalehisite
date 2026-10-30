import { getSession } from "@/lib/auth/session";
import { listCollaboratorDirectory, listInbox, listVisibleBots } from "@/lib/data/workspace";
import { ChatHome } from "@/components/workspace/ChatHome";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const done = routeTimer("page /ws/chat");
  const session = await getSession();
  const [inbox, people, bots] = await Promise.all([
    listInbox(session?.id, session).catch(() => []),
    listCollaboratorDirectory(session).catch(() => []),
    listVisibleBots(session).catch(() => []),
  ]);
  done();
  return (
    <ChatHome
      initial={inbox}
      people={people.filter((person) => person.id !== session?.id)}
      bots={bots}
      userId={session?.id ?? ""}
    />
  );
}
