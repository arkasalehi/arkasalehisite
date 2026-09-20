import { getSession } from "@/lib/auth/session";
import { listInbox } from "@/lib/data/workspace";
import { ChatInbox } from "@/components/workspace/ChatInbox";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const session = await getSession();
  const items = await listInbox(session?.id).catch(() => []);
  return <ChatInbox items={items} username={session?.username ?? ""} />;
}
