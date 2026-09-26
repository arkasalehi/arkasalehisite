"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Lock, MessageSquare, Plus, Video } from "lucide-react";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import { EmptyState } from "@/components/workspace/EmptyState";
import { isAdminRole } from "@/lib/auth/roles";
import type { ChatPerson } from "@/lib/data/workspace";
import type { StudioEvent, StudioPerson, StudioProject } from "@/lib/data/studio";
import { chatAvatarColor } from "@/lib/workspace/chat";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";
import { PeopleGrid } from "@/components/workspace/PeopleGrid";
import { JalaliCalendar } from "@/components/workspace/JalaliCalendar";

function BoardField({ projectId, initial, writable }: { projectId: string; initial: string; writable: boolean }) {
  const { t } = useWsChrome();
  const router = useRouter();
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setBody(initial);
  }, [initial]);
  async function save() {
    setBusy(true);
    await fetch("/api/workspace/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: projectId, boardBody: body }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <div>
      <p className="ws-label">{t.boardNotes}</p>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} readOnly={!writable} className="ws-input mt-2 h-28 w-full py-2" />
      {writable ? (
        <button type="button" className="ws-btn ws-btn-ghost mt-2" disabled={busy} onClick={() => void save()}>
          {busy ? t.saving : t.save}
        </button>
      ) : null}
    </div>
  );
}

export function ProjectInbox({
  projects,
  people,
  team,
  events,
  userId,
  role,
}: {
  projects: StudioProject[];
  people: ChatPerson[];
  team: StudioPerson[];
  events: StudioEvent[];
  userId: string;
  role: string;
}) {
  const { t, locale } = useWsChrome();
  const router = useRouter();
  const admin = isAdminRole(role);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([userId]);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const others = useMemo(() => people.filter((person) => person.id !== userId), [people, userId]);
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id === "people" || id === "calendar") document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/workspace/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description, memberIds }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/workspace/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    router.refresh();
  }

  async function addTask(projectId: string, form: HTMLFormElement, parentId?: string) {
    const data = new FormData(form);
    const title = String(data.get("title") ?? "").trim();
    const dueAt = String(data.get("dueAt") ?? "");
    const assigneeIds = [...form.querySelectorAll<HTMLInputElement>("input[name=assignee]:checked")].map((el) => el.value);
    if (!title) return;
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, parentId, title, dueAt: dueAt || null, assigneeIds }),
    });
    form.reset();
    router.refresh();
  }

  return (
    <div className="ws-scroll h-full overflow-auto p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="ws-title">{t.inbox}</h1>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <a href="#people" className="ws-btn ws-btn-ghost">
            {t.people}
          </a>
          <a href="#calendar" className="ws-btn ws-btn-ghost">
            {t.calendar}
          </a>
          {admin ? (
            <button type="button" className="ws-btn ws-btn-primary" onClick={() => setOpen((v) => !v)}>
              <Plus className="h-4 w-4" /> {t.newProject}
            </button>
          ) : null}
        </div>
      </div>
      {open && admin ? (
        <form onSubmit={(e) => void create(e)} className="ws-card mb-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="ws-input w-full" placeholder={t.newProject} required />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="ws-input h-20 w-full py-2" placeholder={t.description} />
          <div className="flex flex-wrap gap-2">
            {others.map((person) => (
              <label key={person.id} className="flex items-center gap-2 rounded-full bg-[var(--input-BackgroundColor)] px-3 py-1 text-[12px]">
                <input type="checkbox" checked={memberIds.includes(person.id)} onChange={() => setMemberIds((prev) => (prev.includes(person.id) ? prev.filter((id) => id !== person.id) : [...prev, person.id]))} />
                {person.displayName || person.username}
              </label>
            ))}
          </div>
          <button type="submit" disabled={busy} className="ws-btn ws-btn-primary">
            {busy ? t.saving : t.save}
          </button>
        </form>
      ) : null}
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" />} title={t.noProjects} body={t.noProjectsBody} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {projects.map((project) => {
            const roots = project.tasks.filter((task) => !task.parentId);
            const writable = project.status === "active";
            return (
              <article key={project.id} className={cn("ws-card", project.status !== "active" && "opacity-80")}>
                <button type="button" className="flex w-full items-start justify-between gap-3 text-start" onClick={() => setExpanded((id) => (id === project.id ? null : project.id))}>
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold">{project.name}</p>
                    <p className="text-[12px] text-[var(--theme-darker-color)]">
                      {project.identifier} · {project.status === "locked" ? t.locked : project.status === "inactive" ? t.inactive : t.activeNow} · {project.progress}%
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 4).map((member) => (
                      <ChatAvatar key={member.id} name={member.displayName} url={member.avatarUrl} color={chatAvatarColor(member.id)} size={28} />
                    ))}
                  </div>
                </button>
                {project.description ? <p className="mt-2 text-[13px] text-[var(--theme-dark-color)]">{project.description}</p> : null}
                <div className="ws-progress mt-3">
                  <span style={{ width: `${project.progress}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                  {project.channelId ? (
                    <Link href={`/ws/chat/${project.channelId}`} className="ws-btn ws-btn-ghost">
                      <MessageSquare className="h-3.5 w-3.5" /> {t.chat}
                    </Link>
                  ) : null}
                  {project.meetingId ? (
                    <Link href={`/ws/meet/${project.meetingId}`} className="ws-btn ws-btn-ghost">
                      <Video className="h-3.5 w-3.5" /> {t.projectRoom}
                    </Link>
                  ) : null}
                  <Link href="/ws/docs" className="ws-btn ws-btn-ghost">
                    {t.files}
                  </Link>
                  {admin ? (
                    <>
                      <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void patch(project.id, { status: project.status === "locked" ? "active" : "locked" })}>
                        <Lock className="h-3.5 w-3.5" /> {project.status === "locked" ? t.unlock : t.lock}
                      </button>
                      <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void patch(project.id, { status: project.status === "inactive" ? "active" : "inactive" })}>
                        {project.status === "inactive" ? t.activate : t.deactivate}
                      </button>
                      <button type="button" className="ws-btn ws-btn-ghost text-[var(--ws-status-cancelled)]" onClick={() => void fetch(`/api/workspace/projects?id=${project.id}`, { method: "DELETE" }).then(() => router.refresh())}>
                        {t.clear}
                      </button>
                    </>
                  ) : null}
                </div>
                {expanded === project.id ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--theme-divider-color)] pt-3">
                    {admin ? (
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          void patch(project.id, { name: String(form.get("name") ?? ""), description: String(form.get("desc") ?? "") });
                        }}
                      >
                        <input name="name" defaultValue={project.name} className="ws-input w-full" />
                        <input name="desc" defaultValue={project.description} className="ws-input w-full" placeholder={t.description} />
                        <button type="submit" className="ws-btn ws-btn-ghost">
                          {t.save}
                        </button>
                      </form>
                    ) : null}
                    {admin ? (
                      <div className="flex flex-wrap gap-2">
                        {people.map((person) => {
                          const on = project.members.some((member) => member.id === person.id);
                          return (
                            <label key={person.id} className="flex items-center gap-2 rounded-full bg-[var(--input-BackgroundColor)] px-3 py-1 text-[12px]">
                              <input
                                type="checkbox"
                                checked={on}
                                disabled={person.id === userId}
                                onChange={() => {
                                  const next = on ? project.members.filter((member) => member.id !== person.id).map((member) => member.id) : [...project.members.map((member) => member.id), person.id];
                                  void patch(project.id, { memberIds: next });
                                }}
                              />
                              {person.displayName || person.username}
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                    <BoardField projectId={project.id} initial={project.boardBody} writable={writable} />
                    <p className="ws-label">{t.tasksNav}</p>
                    {roots.map((task) => {
                      const kids = project.tasks.filter((item) => item.parentId === task.id);
                      return (
                        <div key={task.id} className="rounded-xl bg-[var(--input-BackgroundColor)] px-3 py-2 text-[13px]">
                          <div className="flex items-center justify-between gap-2">
                            <span>{task.title}</span>
                            <span className="text-[11px] text-[var(--theme-darker-color)]">{task.progress}%</span>
                          </div>
                          {task.dueAt ? (
                            <p className="text-[11px] text-[var(--theme-darker-color)]">
                              {t.due} {new Date(task.dueAt).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US")}
                            </p>
                          ) : null}
                          {kids.map((kid) => (
                            <p key={kid.id} className="mt-1 text-[12px] text-[var(--theme-dark-color)]">
                              · {kid.title} {kid.status === "done" ? "✓" : ""}
                            </p>
                          ))}
                          {admin && writable ? (
                            <form
                              className="mt-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                void addTask(project.id, e.currentTarget, task.id);
                              }}
                            >
                              <input name="title" className="ws-input w-full" placeholder={t.subtask} required />
                            </form>
                          ) : null}
                        </div>
                      );
                    })}
                    {admin && writable ? (
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void addTask(project.id, e.currentTarget);
                        }}
                      >
                        <input name="title" className="ws-input w-full" placeholder={t.newIssue} required />
                        <input name="dueAt" type="datetime-local" className="ws-input w-full" />
                        <div className="flex flex-wrap gap-2">
                          {project.members.map((member) => (
                            <label key={member.id} className="text-[12px]">
                              <input type="checkbox" name="assignee" value={member.id} defaultChecked={member.id === userId} className="me-1" />
                              {member.displayName || member.username}
                            </label>
                          ))}
                        </div>
                        <button type="submit" className="ws-btn ws-btn-primary">
                          {t.createIssue}
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      <PeopleGrid people={team} userId={userId} embedded />
      <JalaliCalendar events={events} role={role} embedded />
    </div>
  );
}
