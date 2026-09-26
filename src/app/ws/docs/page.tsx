import { getSession } from "@/lib/auth/session";
import { listStudioFiles, listStudioProjects } from "@/lib/data/studio";
import { ProjectDocs } from "@/components/workspace/ProjectDocs";
import { routeTimer } from "@/lib/timing";

export const dynamic = "force-dynamic";

export default async function DocsIndexPage() {
  const done = routeTimer("page /ws/docs");
  const session = await getSession();
  const [projects, files] = await Promise.all([
    listStudioProjects(session?.id ?? "", session?.role ?? "collaborator").catch(() => []),
    listStudioFiles().catch(() => []),
  ]);
  done();
  return <ProjectDocs projects={projects} files={files} />;
}
