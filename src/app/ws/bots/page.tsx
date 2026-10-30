import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listVisibleBots } from "@/lib/data/workspace";
import { BotRoster } from "@/components/workspace/BotRoster";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function BotsPage() {
  const done = routeTimer("page /ws/bots");
  const session = await getSession();
  if (!session?.isSuperAdmin) redirect("/ws/chat");
  const bots = await listVisibleBots(session).catch(() => []);
  done();
  return <BotRoster bots={bots} />;
}
