import { redirect } from "next/navigation";
import { listChannels } from "@/lib/data/workspace";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const channels = await listChannels();
  if (!channels[0]) {
    return <p className="text-sm text-[#8b938d]">کانالی ساخته نشده.</p>;
  }
  redirect(`/ws/chat/${channels[0].id}`);
}
