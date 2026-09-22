import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listChannels, listMessages } from "@/lib/data/workspace";
import { ChatPanel } from "@/components/workspace/ChatPanel";

export const dynamic = "force-dynamic";

export default async function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const session = await getSession();
  const channels = await listChannels(session?.id);
  const channel = channels.find((c) => c.id === channelId);
  if (!channel || !session) notFound();
  const messages = await listMessages(channelId, session.id);
  return <ChatPanel channelId={channel.id} channelName={channel.name} initial={messages} userId={session.id} />;
}
