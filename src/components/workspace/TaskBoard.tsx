"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import type { WorkspaceTask } from "@/lib/data/workspace";

const COLUMNS: Array<{ id: WorkspaceTask["status"]; label: string }> = [
  { id: "todo", label: "برای انجام" },
  { id: "doing", label: "در حال انجام" },
  { id: "done", label: "انجام شد" },
];

export function TaskBoard({ initial }: { initial: WorkspaceTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");

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
            },
          ]);
        }
        if (payload.eventType === "UPDATE") {
          const row = payload.new as Record<string, unknown>;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === String(row.id)
                ? { ...t, title: String(row.title), status: (row.status as WorkspaceTask["status"]) ?? t.status }
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

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === "todo"),
      doing: tasks.filter((t) => t.status === "doing"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle("");
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value }),
    });
  }

  async function move(id: string, status: WorkspaceTask["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch("/api/workspace/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field flex-1" placeholder="کار تازه…" />
        <Button type="submit">افزودن</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.id} className="rounded-2xl bg-white p-3 shadow-sm">
            <h2 className="px-1 text-sm font-semibold">{col.label}</h2>
            <ul className="mt-3 space-y-2">
              {grouped[col.id].map((task) => (
                <li key={task.id} className="rounded-xl bg-[#f6f7f4] p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#5b655f]"
                        onClick={() => void move(task.id, c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
