"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";

type Person = { id: string; displayName: string };
type Comment = { id: string; body: string; createdAt: string; authorName: string };

export function TaskBoard({ initial, people, projects = [] }: { initial: WorkspaceTask[]; people: Person[]; projects?: WorkspaceProject[] }) {
  const view = useSearchParams().get("view");
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subTitle, setSubTitle] = useState("");
  const [comment, setComment] = useState("");
  const projectFilter = useSearchParams().get("project");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("workspace-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_tasks" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Record<string, unknown>;
          setTasks((prev) => {
            if (prev.some((t) => t.id === String(row.id))) return prev;
            return [
              ...prev,
              {
                id: String(row.id),
                title: String(row.title),
                status: (row.status as WorkspaceTask["status"]) ?? "todo",
                assigneeId: row.assignee_id ? String(row.assignee_id) : null,
                dueAt: row.due_at ? String(row.due_at) : null,
                sort: Number(row.sort ?? 0),
                createdBy: String(row.created_by),
                description: row.description ? String(row.description) : null,
                parentId: row.parent_id ? String(row.parent_id) : null,
                projectId: row.project_id ? String(row.project_id) : null,
                priority: (row.priority as WorkspaceTask["priority"]) ?? "none",
                labels: Array.isArray(row.labels) ? row.labels.map(String) : [],
              },
            ];
          });
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as Record<string, unknown>;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === String(row.id)
                ? {
                    ...t,
                    title: String(row.title),
                    status: (row.status as WorkspaceTask["status"]) ?? t.status,
                    description: row.description ? String(row.description) : t.description,
                    dueAt: row.due_at ? String(row.due_at) : t.dueAt,
                    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
                    priority: (row.priority as WorkspaceTask["priority"]) ?? t.priority,
                    labels: Array.isArray(row.labels) ? row.labels.map(String) : t.labels,
                    projectId: row.project_id ? String(row.project_id) : t.projectId,
                  }
                : t,
            ),
          );
        }
        if (payload.eventType === "DELETE") {
          const row = payload.old as Record<string, unknown>;
          setTasks((prev) => prev.filter((t) => t.id !== String(row.id)));
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const roots = useMemo(() => tasks.filter((t) => !t.parentId), [tasks]);
  const filtered = roots.filter((t) => {
    if (view === "todo") return t.status === "todo";
    if (view === "doing") return t.status === "doing";
    if (view === "done") return t.status === "done";
    if (projectFilter) return t.projectId === projectFilter;
    return true;
  });
  const selected = tasks.find((t) => t.id === active) ?? null;

  useEffect(() => {
    if (!active) return;
    void fetch(`/api/workspace/comments?taskId=${active}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [active]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const value = title.trim();
    setTitle("");
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: typeof body.status === "string" ? (body.status as WorkspaceTask["status"]) : t.status,
              assigneeId: body.assigneeId === undefined ? t.assigneeId : body.assigneeId ? String(body.assigneeId) : null,
              description: body.description === undefined ? t.description : body.description ? String(body.description) : null,
              priority: typeof body.priority === "string" ? (body.priority as WorkspaceTask["priority"]) : t.priority,
              projectId: body.projectId === undefined ? t.projectId : body.projectId ? String(body.projectId) : null,
              labels: Array.isArray(body.labels) ? body.labels.map(String) : t.labels,
            }
          : t,
      ),
    );
    await fetch("/api/workspace/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--theme-divider-color)] px-4 py-2">
        <form onSubmit={(e) => void add(e)} className="flex flex-1 gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 flex-1 rounded-md bg-[var(--input-BackgroundColor)] px-3 text-[13px] outline-none placeholder:text-[var(--input-PlaceholderColor)]" placeholder="New issue" />
          <button type="submit" className="h-8 rounded-md bg-[var(--button-primary-BackgroundColor)] px-3 text-[12px] font-medium text-white">
            Create issue
          </button>
        </form>
      </div>
      {view === "board" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto p-4 md:grid-cols-3">
          {(["todo", "doing", "done"] as const).map((status) => (
            <section key={status} className="rounded-md bg-[var(--theme-navpanel-color)] p-2" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
              const id = e.dataTransfer.getData("text/task-id");
              if (id) void patch(id, { status });
            }}>
              <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-[var(--theme-darker-color)]">{status === "todo" ? "Backlog" : status === "doing" ? "Active" : "Done"}</p>
              {roots.filter((t) => t.status === status).map((t, i) => (
                <article key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/task-id", t.id)} className="mb-1 cursor-grab rounded px-2 py-2 hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setActive(t.id)}>
                  <p className="text-[12px] text-[var(--theme-darker-color)]">ARKA-{i + 1}</p>
                  <p className="text-[13px] text-[var(--theme-caption-color)]">{t.title}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="ws-scroll min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-[var(--theme-comp-header-color)] text-[11px] uppercase tracking-wide text-[var(--theme-darker-color)]">
              <tr>
                <th className="px-4 py-2 font-medium">Issue</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Priority</th>
                <th className="px-4 py-2 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={t.id} className="cursor-pointer border-t border-[var(--theme-divider-color)] hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setActive(t.id)}>
                  <td className="px-4 py-2">
                    <span className="mr-2 text-[var(--theme-darker-color)]">ARKA-{i + 1}</span>
                    {t.title}
                  </td>
                  <td className="px-4 py-2 capitalize text-[var(--theme-dark-color)]">{t.status === "todo" ? "Backlog" : t.status === "doing" ? "Active" : "Done"}</td>
                  <td className="px-4 py-2 text-[var(--theme-dark-color)]">{t.priority}</td>
                  <td className="px-4 py-2 text-[var(--theme-dark-color)]">{people.find((p) => p.id === t.assigneeId)?.displayName || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected ? (
        <div className="absolute inset-y-10 right-0 z-20 w-full max-w-md overflow-auto border-l border-[var(--theme-divider-color)] bg-[var(--theme-bg-color)] p-4">
          <button type="button" className="text-[12px] text-[var(--theme-darker-color)]" onClick={() => setActive(null)}>
            Close
          </button>
          <h2 className="mt-2 text-[18px] font-medium">{selected.title}</h2>
          <div className="mt-3 flex gap-2">
            {(["todo", "doing", "done"] as const).map((s) => (
              <button key={s} type="button" onClick={() => void patch(selected.id, { status: s })} className={cn("rounded px-2 py-1 text-[12px]", selected.status === s ? "bg-[var(--button-primary-BackgroundColor)]" : "bg-[var(--input-BackgroundColor)]")}>
                {s === "todo" ? "Backlog" : s === "doing" ? "Active" : "Done"}
              </button>
            ))}
          </div>
          <select className="mt-3 h-8 w-full rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]" value={selected.assigneeId ?? ""} onChange={(e) => void patch(selected.id, { assigneeId: e.target.value || null })}>
            <option value="">Unassigned</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
          <select className="mt-2 h-8 w-full rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]" value={selected.projectId ?? ""} onChange={(e) => void patch(selected.id, { projectId: e.target.value || null })}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.identifier} · {p.name}
              </option>
            ))}
          </select>
          <select className="mt-2 h-8 w-full rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]" value={selected.priority} onChange={(e) => void patch(selected.id, { priority: e.target.value })}>
            {["none", "low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="mt-2 h-8 w-full rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]"
            defaultValue={selected.labels.join(", ")}
            placeholder="labels, comma separated"
            onBlur={(e) => void patch(selected.id, { labels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
          <textarea defaultValue={selected.description ?? ""} className="mt-3 min-h-32 w-full rounded bg-[var(--input-BackgroundColor)] p-2 text-[13px] outline-none" placeholder="Description" onBlur={(e) => void patch(selected.id, { description: e.target.value })} />
          <h3 className="mt-4 text-[13px] font-medium">Sub-issues</h3>
          <ul className="mt-1 space-y-1 text-[13px]">
            {tasks.filter((t) => t.parentId === selected.id).map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded bg-[var(--input-BackgroundColor)] px-2 py-1">
                <span>{s.title}</span>
                <input type="checkbox" checked={s.status === "done"} onChange={() => void patch(s.id, { status: s.status === "done" ? "todo" : "done" })} />
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!subTitle.trim()) return;
              const value = subTitle.trim();
              setSubTitle("");
              void fetch("/api/workspace/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: value, parentId: selected.id }) });
            }}
          >
            <input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} className="h-8 flex-1 rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]" placeholder="Add sub-issue" />
            <button type="submit" className="text-[12px] text-[var(--theme-link-color)]">
              Add
            </button>
          </form>
          <ul className="mt-4 space-y-2 text-[13px]">
            {comments.map((c) => (
              <li key={c.id} className="rounded bg-[var(--input-BackgroundColor)] px-2 py-2">
                <p className="text-[11px] text-[var(--theme-darker-color)]">{c.authorName}</p>
                {c.body}
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim() || !active) return;
              const body = comment.trim();
              setComment("");
              void fetch("/api/workspace/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: active, body }) });
              setComments((prev) => [...prev, { id: crypto.randomUUID(), body, createdAt: new Date().toISOString(), authorName: "You" }]);
            }}
          >
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="h-8 flex-1 rounded bg-[var(--input-BackgroundColor)] px-2 text-[13px]" placeholder="Comment" />
            <button type="submit" className="text-[12px] text-[var(--theme-link-color)]">
              Send
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
