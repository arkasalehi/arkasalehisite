import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listChannels, listCollaboratorDirectory, listMessages } from "@/lib/data/workspace";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const done = routeTimer("page /ws/chat/[channelId]");
  const { channelId } = await params;
  const session = await getSession();
  const [channels, people] = await Promise.all([
    listChannels(session?.id, session).catch(() => []),
    listCollaboratorDirectory(session).catch(() => []),
  ]);
  const channel = channels.find((item) => item.id === channelId);
  if (!channel || !session) notFound();
  const messages = await listMessages(channelId, session.id, undefined, undefined, session).catch(() => []);
  done();
  return (
    <ChatPanel
      key={channel.id}
      channelId={channel.id}
      channelName={channel.name}
      channelKind={channel.kind}
      initial={messages}
      userId={session.id}
      people={people}
      selfName={session.displayName}
      selfAvatar={session.avatarUrl}
    />
  );
}
