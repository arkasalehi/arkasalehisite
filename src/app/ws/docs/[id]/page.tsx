import { notFound } from "next/navigation";
import { getNote, listTasks } from "@/lib/data/workspace";
import { DocsEditor } from "@/components/workspace/DocsEditor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [note, tasks] = await Promise.all([getNote(id), listTasks().catch(() => [])]);
  if (!note) notFound();
  return <DocsEditor note={note} tasks={tasks} />;
}
