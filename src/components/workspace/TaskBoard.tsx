"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import type { WorkspaceTask } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";

const COLUMNS: Array<{ id: WorkspaceTask["status"]; label: string; tint: string }> = [
  { id: "todo", label: "To do", tint: "bg-[#efe8ff]" },
  { id: "doing", label: "In progress", tint: "bg-[#fff4d6]" },
  { id: "done", label: "Done", tint: "bg-[#e7f8ee]" },
];

type Comment = { id: string; body: string; createdAt: string; authorName: string };

export function TaskBoard({ initial }: { initial: WorkspaceTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const [active, setActive] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [subTitle, setSubTitle] = useState("");

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel("workspace-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_tasks" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Record<string, unknown>;
          setTasks((prev) => [
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
            },
          ]);
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
  const visible = roots.filter((t) => (filter === "done" ? t.status === "done" : filter === "open" ? t.status !== "done" : true));
  const selected = tasks.find((t) => t.id === active) ?? null;
  const subs = tasks.filter((t) => t.parentId === active);

  useEffect(() => {
    if (!active) return;
    void fetch(`/api/workspace/comments?taskId=${active}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [active]);

  async function add(e: React.FormEvent, parentId?: string | null) {
    e.preventDefault();
    const value = (parentId ? subTitle : title).trim();
    if (!value) return;
    if (parentId) setSubTitle("");
    else setTitle("");
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value, parentId: parentId || undefined }),
    });
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...mapPatch(body, t) } : t)));
    await fetch("/api/workspace/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
  }

  async function remove(id: string) {
    setMenu(null);
    setActive(null);
    await fetch(`/api/workspace/tasks?id=${id}`, { method: "DELETE" });
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !comment.trim()) return;
    const body = comment.trim();
    setComment("");
    await fetch("/api/workspace/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: active, body }),
    });
    setComments((prev) => [...prev, { id: crypto.randomUUID(), body, createdAt: new Date().toISOString(), authorName: "You" }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["open", "Ongoing"],
          ["done", "Completed"],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setFilter(id as typeof filter)} className={cn("rounded-full px-4 py-1.5 text-[12px]", filter === id ? "bg-[#7c5cfc] text-white" : "bg-white ring-1 ring-[#e8ece6]")}>
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => void add(e)} className="flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 flex-1 rounded-full border border-[#e8ece6] bg-white px-4 text-sm outline-none" placeholder="Search or add a task…" />
        <Button type="submit" className="bg-[#7c5cfc] text-white hover:opacity-90">
          Add
        </Button>
      </form>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((task) => {
          const tint = COLUMNS.find((c) => c.id === task.status)?.tint ?? "bg-white";
          return (
            <article key={task.id} className={cn("relative rounded-[24px] p-4 shadow-sm", tint)}>
              <button type="button" className="absolute right-3 top-3 text-[#8b938d]" onClick={() => setMenu(menu === task.id ? null : task.id)}>
                ⋯
              </button>
              {menu === task.id ? (
                <div className="absolute right-3 top-10 z-10 w-36 rounded-2xl bg-white p-2 text-[12px] shadow-lg">
                  <button type="button" className="block w-full rounded-xl px-2 py-2 text-left" onClick={() => void patch(task.id, { status: "done" })}>
                    Done task
                  </button>
                  <button type="button" className="block w-full rounded-xl px-2 py-2 text-left" onClick={() => { setActive(task.id); setMenu(null); }}>
                    Edit
                  </button>
                  <button type="button" className="block w-full rounded-xl px-2 py-2 text-left text-rose-600" onClick={() => void remove(task.id)}>
                    Delete
                  </button>
                </div>
              ) : null}
              <button type="button" className="w-full text-left" onClick={() => setActive(task.id)}>
                <p className="pr-6 text-[15px] font-semibold">{task.title}</p>
                <p className="mt-2 text-[12px] text-[#6d7871]">{task.dueAt ? new Date(task.dueAt).toLocaleDateString("en-US") : "No due date"}</p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-[#8b938d]">{task.status}</p>
              </button>
            </article>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-[#f7f8fb] p-4">
          <div className="mx-auto max-w-lg pb-16">
            <div className="flex items-center gap-3">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setActive(null)}>
                ‹
              </button>
              <h2 className="flex-1 text-center text-[16px] font-semibold">Task Details</h2>
              <span className="w-10" />
            </div>
            <h1 className="mt-5 text-[26px] font-semibold tracking-tight">{selected.title}</h1>
            <dl className="mt-5 space-y-3 text-[13px]">
              <Row label="Status" value={selected.status} />
              <Row label="Due date" value={selected.dueAt ? new Date(selected.dueAt).toLocaleDateString("en-US") : "Empty"} />
            </dl>
            <textarea
              defaultValue={selected.description ?? ""}
              placeholder="Add a description"
              className="mt-4 min-h-24 w-full rounded-[20px] bg-white p-3 text-sm outline-none ring-1 ring-[#e8ece6]"
              onBlur={(e) => void patch(selected.id, { description: e.target.value })}
            />
            <input type="date" className="mt-3 h-11 w-full rounded-full bg-white px-4 text-sm ring-1 ring-[#e8ece6]" onChange={(e) => void patch(selected.id, { dueAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <div className="mt-3 flex gap-2">
              {COLUMNS.map((c) => (
                <button key={c.id} type="button" onClick={() => void patch(selected.id, { status: c.id })} className={cn("rounded-full px-3 py-1.5 text-[12px]", selected.status === c.id ? "bg-[#1e2a24] text-white" : "bg-white")}>
                  {c.label}
                </button>
              ))}
            </div>
            <h3 className="mt-6 text-[14px] font-semibold">Sub task</h3>
            <ul className="mt-2 space-y-2">
              {subs.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm">
                  <span>{s.title}</span>
                  <input type="checkbox" checked={s.status === "done"} onChange={() => void patch(s.id, { status: s.status === "done" ? "todo" : "done" })} />
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => void add(e, selected.id)} className="mt-2 flex gap-2">
              <input value={subTitle} onChange={(e) => setSubTitle(e.target.value)} className="h-11 flex-1 rounded-full bg-white px-4 text-sm ring-1 ring-[#e8ece6]" placeholder="Add subtask" />
              <Button type="submit" className="bg-[#7c5cfc] text-white">
                Add
              </Button>
            </form>
            <h3 className="mt-6 text-[14px] font-semibold">Comments</h3>
            <ul className="mt-2 space-y-2 text-[13px]">
              {comments.map((c) => (
                <li key={c.id} className="rounded-2xl bg-white px-3 py-2">
                  <p className="text-[11px] text-[#8b938d]">{c.authorName}</p>
                  {c.body}
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => void postComment(e)} className="mt-3 flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} className="h-11 flex-1 rounded-full bg-white px-4 text-sm ring-1 ring-[#e8ece6]" placeholder="Post a comment" />
              <Button type="submit" className="bg-[#7c5cfc] text-white">
                Send
              </Button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function mapPatch(body: Record<string, unknown>, t: WorkspaceTask): WorkspaceTask {
  return {
    ...t,
    title: typeof body.title === "string" ? body.title : t.title,
    status: typeof body.status === "string" ? (body.status as WorkspaceTask["status"]) : t.status,
    description: body.description === undefined ? t.description : body.description ? String(body.description) : null,
    dueAt: body.dueAt === undefined ? t.dueAt : body.dueAt ? String(body.dueAt) : null,
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-3">
      <span className="text-[#8b938d]">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
