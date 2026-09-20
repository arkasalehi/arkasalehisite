import { listTasks } from "@/lib/data/workspace";
import { TaskBoard } from "@/components/workspace/TaskBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await listTasks();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">بورد کارها</h1>
      <TaskBoard initial={tasks} />
    </div>
  );
}
