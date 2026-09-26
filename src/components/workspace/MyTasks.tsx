"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { EmptyState } from "@/components/workspace/EmptyState";
import { isAdminRole } from "@/lib/auth/roles";
import type { StudioExtension, StudioProject, StudioTask } from "@/lib/data/studio";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

export function MyTasks({
  tasks,
  projects,
  extensions,
  userId,
  role,
}: {
  tasks: StudioTask[];
  projects: StudioProject[];
  extensions: StudioExtension[];
  userId: string;
  role: string;
}) {
  const { t, locale } = useWsChrome();
  const router = useRouter();
  const admin = isAdminRole(role);
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) {
      for (const member of project.members) map.set(member.id, member.displayName || member.username);
    }
    return map;
  }, [projects]);
  const roots = tasks.filter((task) => !task.parentId);
  const pending = extensions.filter((item) => item.status === "pending");
  const adminPending = admin ? pending : [];

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/workspace/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function addSub(parentId: string, projectId: string, title: string) {
    if (!title.trim()) return;
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, projectId, title: title.trim(), assigneeIds: [userId] }),
    });
    router.refresh();
  }

  if (!roots.length && !adminPending.length) {
    return <EmptyState icon={<CheckSquare className="h-5 w-5" />} title={t.myTasks} body={t.emptyIssuesBody} />;
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-4">
      <h1 className="ws-title mb-4">{t.myTasks}</h1>
      {adminPending.length ? (
        <section className="ws-card mb-4">
          <p className="ws-label mb-2">{t.requestTime}</p>
          {adminPending.map((item) => {
            const task = projects.flatMap((project) => project.tasks).find((row) => row.id === item.taskId);
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-divider-color)] py-2 last:border-0">
                <div>
                  <p className="text-[14px]">{task?.title ?? item.taskId}</p>
                  <p className="text-[12px] text-[var(--theme-darker-color)]">
                    {item.extraHours} {t.hours} · {item.reason || t.pending}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="ws-btn ws-btn-primary" onClick={() => void patch({ id: item.taskId, extensionId: item.id, extensionStatus: "approved" })}>
                    {t.allow}
                  </button>
                  <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void patch({ id: item.taskId, extensionId: item.id, extensionStatus: "denied" })}>
                    {t.deny}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}
      <div className="space-y-3">
        {projects.map((project) => {
          const projectRoots = roots.filter((task) => task.projectId === project.id);
          if (!projectRoots.length) return null;
          return (
            <section key={project.id} className="ws-card">
              <p className="mb-3 text-[13px] font-semibold text-[var(--theme-darker-color)]">{project.name}</p>
              {projectRoots.map((task) => {
                const kids = tasks.filter((item) => item.parentId === task.id);
                const mineExt = pending.find((item) => item.taskId === task.id && item.userId === userId);
                return (
                  <article key={task.id} className="mb-3 rounded-xl bg-[var(--input-BackgroundColor)] px-3 py-3 last:mb-0">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={task.status === "done"}
                        onChange={() => void patch({ id: task.id, status: task.status === "done" ? "todo" : "done" })}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn("font-medium", task.status === "done" && "line-through opacity-60")}>{task.title}</p>
                          <span className="text-[12px] text-[var(--theme-darker-color)]">{task.progress}%</span>
                        </div>
                        <p className="text-[12px] text-[var(--theme-darker-color)]">
                          {task.dueAt ? `${t.due} ${new Date(task.dueAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}` : t.unassigned}
                          {task.assigneeIds.length ? ` · ${task.assigneeIds.map((id) => names.get(id) ?? "").filter(Boolean).join(", ")}` : ""}
                        </p>
                        <div className="ws-progress mt-2">
                          <span style={{ width: `${task.progress}%` }} />
                        </div>
                        {kids.map((kid) => (
                          <label key={kid.id} className="mt-2 flex items-center gap-2 text-[13px]">
                            <input type="checkbox" checked={kid.status === "done"} onChange={() => void patch({ id: kid.id, status: kid.status === "done" ? "todo" : "done" })} />
                            <span className={cn(kid.status === "done" && "line-through opacity-60")}>{kid.title}</span>
                          </label>
                        ))}
                        {admin ? (
                          <form
                            className="mt-2 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem("sub") as HTMLInputElement;
                              void addSub(task.id, project.id, input.value);
                              input.value = "";
                            }}
                          >
                            <input name="sub" className="ws-input min-w-0 flex-1" placeholder={t.subtask} />
                          </form>
                        ) : null}
                        {mineExt ? (
                          <p className="mt-2 text-[12px] text-[var(--theme-darker-color)]">
                            {t.requestTime}: {mineExt.extraHours} {t.hours} · {t.pending}
                          </p>
                        ) : (
                          <form
                            className="mt-2 flex flex-wrap gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const hours = Number((e.currentTarget.elements.namedItem("hours") as HTMLInputElement).value);
                              const reason = String((e.currentTarget.elements.namedItem("reason") as HTMLInputElement).value);
                              if (!hours) return;
                              void patch({ id: task.id, extraHours: hours, reason });
                              e.currentTarget.reset();
                            }}
                          >
                            <input name="hours" type="number" min={1} max={168} className="ws-input w-20" placeholder={t.hours} />
                            <input name="reason" className="ws-input min-w-0 flex-1" placeholder={t.requestTime} />
                            <button type="submit" className="ws-btn ws-btn-ghost">
                              {t.extraTime}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
