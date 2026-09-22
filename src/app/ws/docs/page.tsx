import { DocsEditor } from "@/components/workspace/DocsEditor";
import { listTasks } from "@/lib/data/workspace";

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  const tasks = await listTasks().catch(() => []);
  return <DocsEditor note={null} tasks={tasks} />;
}
