import { getSession } from "@/lib/auth/session";
import { listMyStudioTasks } from "@/lib/data/studio";
import { MyTasks } from "@/components/workspace/MyTasks";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const done = routeTimer("page /ws/tasks");
  const session = await getSession();
  const data = await listMyStudioTasks(session?.id ?? "", session?.role ?? "collaborator").catch(() => ({
    tasks: [],
    projects: [],
    extensions: [],
  }));
  done();
  return <MyTasks tasks={data.tasks} projects={data.projects} extensions={data.extensions} userId={session?.id ?? ""} role={session?.role ?? "collaborator"} />;
}
