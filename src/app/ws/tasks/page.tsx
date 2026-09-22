import { Suspense } from "react";
import { listCollaboratorDirectory, listProjects, listTasks } from "@/lib/data/workspace";
import { TaskBoard } from "@/components/workspace/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasks, people, projects] = await Promise.all([listTasks(), listCollaboratorDirectory(), listProjects()]);
  return (
    <div className="relative h-full min-h-0">
      <Suspense fallback={null}>
        <TaskBoard initial={tasks} people={people.map((p) => ({ id: p.id, displayName: p.displayName || p.username }))} projects={projects} />
      </Suspense>
    </div>
  );
}
