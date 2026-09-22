import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/workspace/EmptyState";

export default function ChatIndexPage() {
  return (
    <EmptyState
      icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
      title="Pick a channel"
      body="Open the menu to pick a space, or start a direct message."
    />
  );
}
