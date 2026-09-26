"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { EmptyState } from "@/components/workspace/EmptyState";
import type { StudioFile, StudioProject } from "@/lib/data/studio";
import { uploadWorkspaceFile } from "@/lib/workspace/uploadClient";
import { useWsChrome } from "@/lib/theme/workspace";

export function ProjectDocs({ projects, files }: { projects: StudioProject[]; files: StudioFile[] }) {
  const { t } = useWsChrome();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function upload(projectId: string, file: File) {
    setBusy(projectId);
    try {
      const data = await uploadWorkspaceFile(file);
      await fetch("/api/workspace/project-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: data.name, url: data.url, mime: file.type, sizeBytes: file.size }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!projects.length) {
    return <EmptyState icon={<Folder className="h-5 w-5" />} title={t.noProjects} body={t.noProjectsBody} />;
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-4">
      <h1 className="ws-title mb-4">{t.documents}</h1>
      <div className="grid gap-3 lg:grid-cols-2">
        {projects.map((project) => {
          const items = files.filter((file) => file.projectId === project.id);
          const writable = project.status === "active";
          return (
            <article key={project.id} className="ws-card">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-[12px] text-[var(--theme-darker-color)]">
                    {items.length} {t.files}
                    {project.status !== "active" ? ` · ${project.status === "locked" ? t.locked : t.inactive}` : ""}
                  </p>
                </div>
                {writable ? (
                  <label className="ws-btn ws-btn-primary cursor-pointer">
                    {busy === project.id ? t.saving : t.upload}
                    <input
                      type="file"
                      className="hidden"
                      disabled={busy === project.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(project.id, file);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                ) : null}
              </div>
              <ul className="mt-3 divide-y divide-[var(--theme-divider-color)]">
                {items.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-2 py-2 text-[13px]">
                    <a href={file.url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-[var(--theme-link-color)]">
                      {file.name}
                    </a>
                    <button type="button" className="text-[12px] text-[var(--ws-status-cancelled)]" onClick={() => void fetch(`/api/workspace/project-files?id=${file.id}`, { method: "DELETE" }).then(() => router.refresh())}>
                      {t.clear}
                    </button>
                  </li>
                ))}
                {items.length === 0 ? <li className="py-4 text-center text-[12px] text-[var(--theme-darker-color)]">{t.noFiles}</li> : null}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
