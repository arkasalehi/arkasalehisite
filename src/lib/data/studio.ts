import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth/roles";
import { getActiveTenantId } from "@/lib/data/workspace";
import type { ChatPerson, WorkspaceMeeting, WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";

export type StudioStatus = "active" | "locked" | "inactive";

export type StudioMember = ChatPerson & { role: "manager" | "member" };

export type StudioTask = WorkspaceTask & {
  assigneeIds: string[];
  progress: number;
};

export type StudioProject = WorkspaceProject & {
  description: string;
  status: StudioStatus;
  managerId: string | null;
  channelId: string | null;
  meetingId: string | null;
  boardId: string | null;
  createdAt: string;
  members: StudioMember[];
  progress: number;
  boardBody: string;
  tasks: StudioTask[];
};

export type StudioPerson = ChatPerson & {
  online: boolean;
  performance: number;
  attendance: number | null;
  projectNames: string[];
  openTasks: number;
};

export type StudioEvent = {
  id: string;
  title: string;
  body: string;
  startsAt: string;
  endsAt: string | null;
  notifyAt: string | null;
};

export type StudioFile = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  url: string;
  mime: string;
  sizeBytes: number;
  createdAt: string;
};

export type StudioRoom = WorkspaceMeeting & {
  kind: "project" | "personal" | "custom";
  projectId: string | null;
  ownerId: string | null;
  isOpen: boolean;
  memberIds: string[];
};

export type StudioExtension = {
  id: string;
  taskId: string;
  userId: string;
  extraHours: number;
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

export type StudioJoinRequest = {
  id: string;
  meetingId: string;
  userId: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
};

function taskProgress(task: WorkspaceTask, all: WorkspaceTask[]) {
  const kids = all.filter((item) => item.parentId === task.id);
  if (!kids.length) return task.status === "done" ? 100 : task.status === "doing" ? 50 : 0;
  const done = kids.filter((item) => item.status === "done").length;
  return Math.round((done / kids.length) * 100);
}

export const listStudioProjects = cache(async (userId: string, role: string) => {
  const db = await createServerSupabase();
  const admin = isAdminRole(role);
  const { data, error } = await db
    .from("workspace_projects")
    .select("id, name, identifier, description, status, manager_id, channel_id, meeting_id, board_id, created_at")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error || !data) return [] as StudioProject[];
  const ids = data.map((row) => String(row.id));
  const [members, tasks, notes] = await Promise.all([
    ids.length
      ? db.from("workspace_project_members").select("project_id, user_id, role").in("project_id", ids)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ids.length
      ? db.from("workspace_tasks").select("id, title, status, assignee_id, due_at, sort, created_by, description, parent_id, project_id, priority, labels").in("project_id", ids).order("sort")
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ids.length
      ? db.from("workspace_notes").select("id, body, project_id").in("project_id", ids)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);
  const memberRows = (members.data ?? []) as Array<{ project_id: string; user_id: string; role: string }>;
  const peopleIds = [...new Set(memberRows.map((row) => String(row.user_id)))];
  const profiles = peopleIds.length
    ? await db.from("profiles").select("id, username, display_name, avatar_url").in("id", peopleIds)
    : { data: [] as Array<Record<string, unknown>> };
  const profileMap = new Map(
    (profiles.data ?? []).map((row) => [
      String(row.id),
      {
        id: String(row.id),
        username: String(row.username ?? ""),
        displayName: String(row.display_name ?? ""),
        avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      },
    ]),
  );
  const taskRows = (tasks.data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: (row.status === "doing" || row.status === "done" ? row.status : "todo") as StudioTask["status"],
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    sort: Number(row.sort ?? 0),
    createdBy: String(row.created_by),
    description: row.description ? String(row.description) : null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    projectId: row.project_id ? String(row.project_id) : null,
    priority: (["low", "medium", "high", "urgent"].includes(String(row.priority)) ? row.priority : "none") as StudioTask["priority"],
    labels: Array.isArray(row.labels) ? row.labels.map(String) : [],
    assigneeIds: [] as string[],
    progress: 0,
  })) as StudioTask[];
  const taskIds = taskRows.map((item) => item.id);
  const assignees = taskIds.length
    ? await db.from("workspace_task_assignees").select("task_id, user_id").in("task_id", taskIds)
    : { data: [] as Array<{ task_id: string; user_id: string }> };
  const assignMap = new Map<string, string[]>();
  for (const row of assignees.data ?? []) {
    const tid = String(row.task_id);
    const list = assignMap.get(tid) ?? [];
    list.push(String(row.user_id));
    assignMap.set(tid, list);
  }
  for (const task of taskRows) {
    const extra = assignMap.get(task.id) ?? [];
    task.assigneeIds = [...new Set([...(task.assigneeId ? [task.assigneeId] : []), ...extra])];
    task.progress = taskProgress(task, taskRows);
  }
  const boardMap = new Map((notes.data ?? []).map((row) => [String(row.project_id), String(row.body ?? "")]));
  const groupedMembers = new Map<string, StudioMember[]>();
  for (const row of memberRows) {
    const profile = profileMap.get(String(row.user_id));
    if (!profile) continue;
    const list = groupedMembers.get(String(row.project_id)) ?? [];
    list.push({ ...profile, role: row.role === "manager" ? "manager" : "member" });
    groupedMembers.set(String(row.project_id), list);
  }
  return data
    .map((row) => {
      const id = String(row.id);
      const projectTasks = taskRows.filter((item) => item.projectId === id);
      const roots = projectTasks.filter((item) => !item.parentId);
      const progress = roots.length ? Math.round(roots.reduce((sum, item) => sum + item.progress, 0) / roots.length) : 0;
      const status = row.status === "locked" || row.status === "inactive" ? row.status : "active";
      const members = groupedMembers.get(id) ?? [];
      if (!admin && (status === "inactive" || !members.some((member) => member.id === userId))) return null;
      return {
        id,
        name: String(row.name),
        identifier: String(row.identifier ?? "ARKA"),
        description: String(row.description ?? ""),
        status,
        managerId: row.manager_id ? String(row.manager_id) : null,
        channelId: row.channel_id ? String(row.channel_id) : null,
        meetingId: row.meeting_id ? String(row.meeting_id) : null,
        boardId: row.board_id ? String(row.board_id) : null,
        createdAt: String(row.created_at),
        members,
        progress,
        boardBody: boardMap.get(id) ?? "",
        tasks: projectTasks,
      } satisfies StudioProject;
    })
    .filter(Boolean) as StudioProject[];
});

export const listStudioPeople = cache(async () => {
  const db = await createServerSupabase();
  const { data: people, error } = await db
    .from("profiles")
    .select("id, username, display_name, avatar_url, role")
    .in("role", ["admin", "collaborator"])
    .order("display_name")
    .limit(80);
  if (error || !people) return [] as StudioPerson[];
  const ids = people.map((row) => String(row.id));
  const [presence, assignees, sessions, members] = await Promise.all([
    db.from("workspace_presence").select("user_id, last_seen").in("user_id", ids),
    db.from("workspace_task_assignees").select("task_id, user_id").in("user_id", ids),
    db.from("workspace_call_sessions").select("user_id, meeting_id").in("user_id", ids),
    db.from("workspace_project_members").select("project_id, user_id"),
  ]);
  const seen = new Map((presence.data ?? []).map((row) => [String(row.user_id), String(row.last_seen)]));
  const taskIds = [...new Set((assignees.data ?? []).map((row) => String(row.task_id)))];
  const taskRows = taskIds.length
    ? await db.from("workspace_tasks").select("id, status, parent_id").in("id", taskIds)
    : { data: [] as Array<{ id: string; status: string; parent_id: string | null }> };
  const taskMap = new Map((taskRows.data ?? []).map((row) => [String(row.id), row]));
  const projectIds = [...new Set((members.data ?? []).map((row) => String(row.project_id)))];
  const projects = projectIds.length
    ? await db.from("workspace_projects").select("id, name").in("id", projectIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const projectName = new Map((projects.data ?? []).map((row) => [String(row.id), String(row.name)]));
  const now = Date.now();
  return people.map((row) => {
    const uid = String(row.id);
    const last = seen.get(uid);
    const mine = (assignees.data ?? []).filter((item) => String(item.user_id) === uid).map((item) => taskMap.get(String(item.task_id))).filter(Boolean);
    const roots = mine.filter((item) => !item?.parent_id);
    const done = roots.filter((item) => item?.status === "done").length;
    const joined = new Set((sessions.data ?? []).filter((item) => String(item.user_id) === uid).map((item) => String(item.meeting_id))).size;
    const projectNames = [...new Set((members.data ?? []).filter((item) => String(item.user_id) === uid).map((item) => projectName.get(String(item.project_id))).filter(Boolean))] as string[];
    return {
      id: uid,
      username: String(row.username ?? ""),
      displayName: String(row.display_name ?? ""),
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      online: last ? now - new Date(last).getTime() < 90_000 : false,
      performance: roots.length ? Math.round((done / roots.length) * 100) : 0,
      attendance: joined ? Math.min(100, Math.round((joined / Math.max(1, projectNames.length)) * 100)) : null,
      projectNames,
      openTasks: roots.filter((item) => item?.status !== "done").length,
    };
  });
});

export const listStudioEvents = cache(async () => {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("workspace_calendar_events")
    .select("id, title, body, starts_at, ends_at, notify_at")
    .order("starts_at")
    .limit(120);
  if (error || !data) return [] as StudioEvent[];
  return data.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body ?? ""),
    startsAt: String(row.starts_at),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    notifyAt: row.notify_at ? String(row.notify_at) : null,
  }));
});

export const listStudioFiles = cache(async (projectId?: string) => {
  const db = await createServerSupabase();
  let q = db.from("workspace_project_files").select("id, project_id, user_id, name, url, mime, size_bytes, created_at").order("created_at", { ascending: false }).limit(200);
  if (projectId) q = q.eq("project_id", projectId);
  const { data, error } = await q;
  if (error || !data) return [] as StudioFile[];
  return data.map((row) => ({
    id: String(row.id),
    projectId: String(row.project_id),
    userId: String(row.user_id),
    name: String(row.name),
    url: String(row.url),
    mime: String(row.mime ?? ""),
    sizeBytes: Number(row.size_bytes ?? 0),
    createdAt: String(row.created_at),
  }));
});

export const listStudioRooms = cache(async (): Promise<StudioRoom[]> => {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("workspace_meetings")
    .select("id, title, starts_at, ends_at, room_name, created_by, kind, project_id, owner_id, is_open")
    .order("created_at", { ascending: false })
    .limit(80);
  if (error || !data) return [] as StudioRoom[];
  const ids = data.map((row) => String(row.id));
  const members = ids.length
    ? await db.from("workspace_meeting_members").select("meeting_id, user_id").in("meeting_id", ids)
    : { data: [] as Array<{ meeting_id: string; user_id: string }> };
  const memberMap = new Map<string, string[]>();
  for (const row of members.data ?? []) {
    const id = String(row.meeting_id);
    const list = memberMap.get(id) ?? [];
    list.push(String(row.user_id));
    memberMap.set(id, list);
  }
  return data.map((row): StudioRoom => ({
    id: String(row.id),
    title: String(row.title),
    startsAt: String(row.starts_at),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    roomName: String(row.room_name),
    createdBy: String(row.created_by),
    kind: row.kind === "personal" ? "personal" : row.kind === "custom" ? "custom" : "project",
    projectId: row.project_id ? String(row.project_id) : null,
    ownerId: row.owner_id ? String(row.owner_id) : null,
    isOpen: Boolean(row.is_open),
    memberIds: memberMap.get(String(row.id)) ?? [],
  }));
});

export const listMyStudioTasks = cache(async (userId: string, role: string) => {
  const projects = await listStudioProjects(userId, role);
  const mine = projects.flatMap((project) => project.tasks.filter((task) => task.assigneeIds.includes(userId)));
  const unique = new Map(mine.map((task) => [task.id, task]));
  const tasks = [...unique.values()];
  const db = await createServerSupabase();
  const admin = isAdminRole(role);
  const taskIds = admin ? projects.flatMap((project) => project.tasks.map((task) => task.id)) : tasks.map((task) => task.id);
  const extensions = taskIds.length
    ? await db.from("workspace_task_extensions").select("id, task_id, user_id, extra_hours, reason, status, created_at").in("task_id", taskIds).order("created_at", { ascending: false }).limit(80)
    : { data: [] as Array<Record<string, unknown>> };
  return {
    tasks,
    projects,
    extensions: ((extensions.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      taskId: String(row.task_id),
      userId: String(row.user_id),
      extraHours: Number(row.extra_hours ?? 0),
      reason: String(row.reason ?? ""),
      status: row.status === "approved" || row.status === "denied" ? row.status : "pending",
      createdAt: String(row.created_at),
    })) as StudioExtension[],
  };
});

export const getStudioMeeting = cache(async (id: string) => {
  const rooms = await listStudioRooms();
  return rooms.find((room) => room.id === id) ?? null;
});

export async function canJoinStudioMeeting(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.rpc("can_join_meeting", { p_meeting_id: id });
  if (error) return false;
  return Boolean(data);
}

export async function ensurePersonalRoom(userId: string, title: string) {
  const db = await createServerSupabase();
  const existing = await db.from("workspace_meetings").select("id").eq("kind", "personal").eq("owner_id", userId).maybeSingle();
  if (existing.data?.id) return String(existing.data.id);
  const tenantId = await getActiveTenantId();
  if (!tenantId) return null;
  const slug = `me-${userId.replace(/-/g, "").slice(0, 12)}`;
  const { data } = await db
    .from("workspace_meetings")
    .insert({
      title: title.slice(0, 80) || "Room",
      starts_at: new Date().toISOString(),
      room_name: slug,
      created_by: userId,
      tenant_id: tenantId,
      kind: "personal",
      owner_id: userId,
      is_open: false,
    })
    .select("id")
    .single();
  return data?.id ? String(data.id) : null;
}
