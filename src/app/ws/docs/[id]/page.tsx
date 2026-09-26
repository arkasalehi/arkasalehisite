import { notFound } from "next/navigation";
import { getNote, listNavTasks } from "@/lib/data/workspace";
import { DocsEditor } from "@/components/workspace/DocsEditor";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const done = routeTimer("page /ws/docs/[id]");
  const { id } = await params;
  const [note, tasks] = await Promise.all([getNote(id), listNavTasks().catch(() => [])]);
  done();
  if (!note) notFound();
  return <DocsEditor note={note} tasks={tasks} />;
}
