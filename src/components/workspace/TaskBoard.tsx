"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleDot, ListTodo } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/workspace/EmptyState";
import { wsCopy } from "@/lib/workspace/copy";

type Person = { id: string; displayName: string };
type Comment = { id: string; body: string; createdAt: string; authorName: string };

const STATUS_COLOR: Record<WorkspaceTask["status"], string> = {
  todo: "var(--ws-status-backlog)",
  doing: "var(--ws-status-progress)",
  done: "var(--ws-status-done)",
};
const PRIORITY_COLOR: Record<WorkspaceTask["priority"], string> = {
  none: "var(--ws-priority-none)",
  low: "var(--ws-priority-low)",
  medium: "var(--ws-priority-medium)",
  high: "var(--ws-priority-high)",
  urgent: "var(--ws-priority-urgent)",
};

export function TaskBoard({ initial, people, projects = [] }: { initial: WorkspaceTask[]; people: Person[]; projects?: WorkspaceProject[] }) {
  const view = useSearchParams().get("view");
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subTitle, setSubTitle] = useState("");
  const [comment, setComment] = useState("");
  const [creating, setCreating] = useState(false);
  const [locale, setLocale] = useState<"en" | "fa">("en");
  const projectFilter = useSearchParams().get("project");
  const t = wsCopy(locale);

  useEffect(() => {
    setLocale(localStorage.getItem("ws-locale") === "fa" ? "fa" : "en");
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("workspace-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_tasks" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Record<string, unknown>;
          setTasks((prev) => {
            if (prev.some((item) => item.id === String(row.id))) return prev;
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
            prev.map((item) =>
              item.id === String(row.id)
                ? {
                    ...item,
                    title: String(row.title),
                    status: (row.status as WorkspaceTask["status"]) ?? item.status,
                    description: row.description ? String(row.description) : item.description,
                    dueAt: row.due_at ? String(row.due_at) : item.dueAt,
                    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
                    priority: (row.priority as WorkspaceTask["priority"]) ?? item.priority,
                    labels: Array.isArray(row.labels) ? row.labels.map(String) : item.labels,
                    projectId: row.project_id ? String(row.project_id) : item.projectId,
                  }
                : item,
            ),
          );
        }
        if (payload.eventType === "DELETE") {
          const row = payload.old as Record<string, unknown>;
          setTasks((prev) => prev.filter((item) => item.id !== String(row.id)));
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const roots = useMemo(() => tasks.filter((item) => !item.parentId), [tasks]);
  const filtered = roots.filter((item) => {
    if (view === "todo") return item.status === "todo";
    if (view === "doing") return item.status === "doing";
    if (view === "done") return item.status === "done";
    if (projectFilter) return item.projectId === projectFilter;
    return true;
  });
  const selected = tasks.find((item) => item.id === active) ?? null;

  useEffect(() => {
    if (!active) return;
    void fetch(`/api/workspace/comments?taskId=${active}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [active]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || creating) return;
    const value = title.trim();
    setTitle("");
    setCreating(true);
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
    setCreating(false);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setTasks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: typeof body.status === "string" ? (body.status as WorkspaceTask["status"]) : item.status,
              assigneeId: body.assigneeId === undefined ? item.assigneeId : body.assigneeId ? String(body.assigneeId) : null,
              description: body.description === undefined ? item.description : body.description ? String(body.description) : null,
              priority: typeof body.priority === "string" ? (body.priority as WorkspaceTask["priority"]) : item.priority,
              projectId: body.projectId === undefined ? item.projectId : body.projectId ? String(body.projectId) : null,
              labels: Array.isArray(body.labels) ? body.labels.map(String) : item.labels,
            }
          : item,
      ),
    );
    await fetch("/api/workspace/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
  }

  const emptyCopy =
    view === "todo"
      ? { title: t.emptyBacklogTitle, body: t.emptyBacklogBody }
      : view === "doing"
        ? { title: t.emptyActiveTitle, body: t.emptyActiveBody }
        : { title: t.emptyIssuesTitle, body: t.emptyIssuesBody };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-[var(--ws-space-2)] border-b border-[var(--theme-divider-color)] px-[var(--ws-space-4)] py-[var(--ws-space-2)]">
        <form onSubmit={(e) => void add(e)} className="flex flex-1 gap-[var(--ws-space-2)]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input flex-1" placeholder="New issue" />
          <button type="submit" disabled={creating} className="ws-btn ws-btn-primary">
            {creating ? <span className="ws-spinner" /> : t.createIssue}
          </button>
        </form>
      </div>
      {view === "board" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-[var(--ws-space-3)] overflow-auto p-[var(--ws-space-4)] md:grid-cols-3">
          {(["todo", "doing", "done"] as const).map((status) => {
            const column = roots.filter((item) => item.status === status);
            return (
              <section
                key={status}
                className="rounded-[var(--ws-radius)] bg-[var(--theme-navpanel-color)] p-[var(--ws-space-2)]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/task-id");
                  if (id) void patch(id, { status });
                }}
              >
                <p className="flex items-center gap-[var(--ws-space-2)] px-[var(--ws-space-2)] py-[var(--ws-space-1)] text-[length:var(--ws-type-xs)] font-semibold uppercase tracking-[var(--ws-tracking-label)]" style={{ color: STATUS_COLOR[status] }}>
                  <span className="ws-dot" />
                  {status === "todo" ? t.backlog : status === "doing" ? t.active : "Done"}
                </p>
                {column.length === 0 ? (
                  <p className="px-[var(--ws-space-2)] py-[var(--ws-space-4)] text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">Drop an issue here.</p>
                ) : (
                  column.map((item, i) => (
                    <article
                      key={item.id}
                      draggable
                      data-row
                      onDragStart={(e) => e.dataTransfer.setData("text/task-id", item.id)}
                      className={cn("mb-[var(--ws-space-1)] cursor-grab rounded-[var(--ws-radius)] px-[var(--ws-space-2)] py-[var(--ws-space-2)] hover:bg-[var(--theme-navpanel-hovered)]", active === item.id && "bg-[var(--theme-navpanel-selected)]")}
                      onClick={() => setActive(item.id)}
                    >
                      <p className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">ARKA-{i + 1}</p>
                      <p className="text-[length:var(--ws-type-sm)] font-medium">{item.title}</p>
                    </article>
                  ))
                )}
              </section>
            );
          })}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={view === "doing" ? <CircleDot className="h-5 w-5" strokeWidth={1.75} /> : <ListTodo className="h-5 w-5" strokeWidth={1.75} />}
          title={emptyCopy.title}
          body={emptyCopy.body}
          action={
            <button type="button" className="ws-btn ws-btn-primary" onClick={() => document.querySelector<HTMLInputElement>(".ws-input")?.focus()}>
              {t.createIssue}
            </button>
          }
        />
      ) : (
        <div className="ws-scroll min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-start text-[length:var(--ws-type-sm)]">
            <thead className="sticky top-0 bg-[var(--theme-comp-header-color)] text-[length:var(--ws-type-xs)] uppercase tracking-[var(--ws-tracking-label)] text-[var(--theme-darker-color)]">
              <tr>
                <th className="px-[var(--ws-space-4)] py-[var(--ws-space-2)] font-medium">Issue</th>
                <th className="px-[var(--ws-space-4)] py-[var(--ws-space-2)] font-medium">Status</th>
                <th className="px-[var(--ws-space-4)] py-[var(--ws-space-2)] font-medium">Priority</th>
                <th className="px-[var(--ws-space-4)] py-[var(--ws-space-2)] font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr
                  key={item.id}
                  data-row
                  className={cn("cursor-pointer border-t border-[var(--theme-divider-color)] hover:bg-[var(--theme-navpanel-hovered)]", active === item.id && "bg-[var(--theme-navpanel-selected)]")}
                  onClick={() => setActive(item.id)}
                >
                  <td className="px-[var(--ws-space-4)] py-[var(--ws-space-2)]">
                    <span className="me-[var(--ws-space-2)] text-[var(--theme-darker-color)]">ARKA-{i + 1}</span>
                    {item.title}
                  </td>
                  <td className="px-[var(--ws-space-4)] py-[var(--ws-space-2)]">
                    <span className="ws-chip" style={{ color: STATUS_COLOR[item.status], background: "var(--input-BackgroundColor)" }}>
                      <span className="ws-dot" />
                      {item.status === "todo" ? t.backlog : item.status === "doing" ? t.active : "Done"}
                    </span>
                  </td>
                  <td className="px-[var(--ws-space-4)] py-[var(--ws-space-2)]" style={{ color: PRIORITY_COLOR[item.priority] }}>
                    {item.priority}
                  </td>
                  <td className="px-[var(--ws-space-4)] py-[var(--ws-space-2)] text-[var(--theme-dark-color)]">{people.find((p) => p.id === item.assigneeId)?.displayName || "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected ? (
        <div className="absolute inset-y-10 end-0 z-20 w-full max-w-md overflow-auto border-s border-[var(--theme-divider-color)] bg-[var(--theme-bg-color)] p-[var(--ws-space-4)] max-md:inset-0 max-md:max-w-none">
          <button type="button" className="ws-btn ws-btn-ghost text-[var(--theme-darker-color)]" onClick={() => setActive(null)}>
            Close
          </button>
          <h2 className="mt-[var(--ws-space-2)] text-[length:var(--ws-type-xl)]">{selected.title}</h2>
          <div className="mt-[var(--ws-space-3)] flex gap-[var(--ws-space-2)]">
            {(["todo", "doing", "done"] as const).map((s) => (
              <button key={s} type="button" onClick={() => void patch(selected.id, { status: s })} className={cn("ws-btn", selected.status === s ? "text-[var(--ws-on-accent)]" : "ws-btn-ghost")} style={selected.status === s ? { background: STATUS_COLOR[s] } : undefined}>
                {s === "todo" ? t.backlog : s === "doing" ? t.active : "Done"}
              </button>
            ))}
          </div>
          <select className="ws-input mt-[var(--ws-space-3)] w-full" value={selected.assigneeId ?? ""} onChange={(e) => void patch(selected.id, { assigneeId: e.target.value || null })}>
            <option value="">Unassigned</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
          <select className="ws-input mt-[var(--ws-space-2)] w-full" value={selected.projectId ?? ""} onChange={(e) => void patch(selected.id, { projectId: e.target.value || null })}>
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.identifier} · {p.name}
              </option>
            ))}
          </select>
          <select className="ws-input mt-[var(--ws-space-2)] w-full" value={selected.priority} onChange={(e) => void patch(selected.id, { priority: e.target.value })}>
            {["none", "low", "medium", "high", "urgent"].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="ws-input mt-[var(--ws-space-2)] w-full"
            defaultValue={selected.labels.join(", ")}
            placeholder="labels, comma separated"
            onBlur={(e) => void patch(selected.id, { labels: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
          <textarea defaultValue={selected.description ?? ""} className="mt-[var(--ws-space-3)] min-h-32 w-full rounded-[var(--ws-radius)] bg-[var(--input-BackgroundColor)] p-[var(--ws-space-2)] text-[length:var(--ws-type-sm)] outline-none" placeholder="Description" onBlur={(e) => void patch(selected.id, { description: e.target.value })} />
          <h3 className="mt-[var(--ws-space-4)] text-[length:var(--ws-type-sm)] font-medium">Sub-issues</h3>
          <ul className="mt-[var(--ws-space-1)] space-y-[var(--ws-space-1)] text-[length:var(--ws-type-sm)]">
            {tasks
              .filter((item) => item.parentId === selected.id)
              .map((sub) => (
                <li key={sub.id} className="flex items-center justify-between rounded-[var(--ws-radius)] bg-[var(--input-BackgroundColor)] px-[var(--ws-space-2)] py-[var(--ws-space-1)]">
                  <span>{sub.title}</span>
                  <input type="checkbox" checked={sub.status === "done"} onChange={() => void patch(sub.id, { status: sub.status === "done" ? "todo" : "done" })} />
                </li>
              ))}
          </ul>
          <form
            className="mt-[var(--ws-space-2)] flex gap-[var(--ws-space-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!subTitle.trim()) return;
              const value = subTitle.trim();
              setSubTitle("");
              void fetch("/api/workspace/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: value, parentId: selected.id }) });
            }}
          >
            <input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} className="ws-input flex-1" placeholder="Add sub-issue" />
            <button type="submit" className="ws-btn ws-btn-ghost text-[var(--ws-accent)]">
              Add
            </button>
          </form>
          <ul className="mt-[var(--ws-space-4)] space-y-[var(--ws-space-2)] text-[length:var(--ws-type-sm)]">
            {comments.map((c) => (
              <li key={c.id} className="rounded-[var(--ws-radius)] bg-[var(--input-BackgroundColor)] px-[var(--ws-space-2)] py-[var(--ws-space-2)]">
                <p className="text-[length:var(--ws-type-xs)] text-[var(--theme-darker-color)]">{c.authorName}</p>
                {c.body}
              </li>
            ))}
          </ul>
          <form
            className="mt-[var(--ws-space-2)] flex gap-[var(--ws-space-2)]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim() || !active) return;
              const body = comment.trim();
              setComment("");
              void fetch("/api/workspace/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId: active, body }) });
              setComments((prev) => [...prev, { id: crypto.randomUUID(), body, createdAt: new Date().toISOString(), authorName: "You" }]);
            }}
          >
            <input value={comment} onChange={(e) => setComment(e.target.value)} className="ws-input flex-1" placeholder="Comment" />
            <button type="submit" className="ws-btn ws-btn-ghost text-[var(--ws-accent)]">
              Send
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
