import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { listChannels } from "@/lib/data/workspace";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace",
};

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const channels = await listChannels().catch(() => []);
  return (
    <WorkspaceShell displayName={session?.displayName ?? ""} channels={channels}>
      {children}
    </WorkspaceShell>
  );
}
