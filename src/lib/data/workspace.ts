import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";

export type WorkspaceChannel = { id: string; slug: string; name: string; kind: string };
export type WorkspaceMessage = {
  id: string;
  channelId: string;
  userId: string;
  body: string;
  createdAt: string;
  kind: "text" | "file" | "voice";
  fileName: string | null;
  fileUrl: string | null;
  replyTo: string | null;
  author?: { displayName: string; username: string; avatarUrl: string | null };
  reactions: Array<{ emoji: string; count: number; mine: boolean }>;
};
export type WorkspaceMeeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  roomName: string;
  createdBy: string;
};
export type WorkspaceTask = {
  id: string;
  title: string;
  status: "todo" | "doing" | "done";
  assigneeId: string | null;
  dueAt: string | null;
  sort: number;
  createdBy: string;
  description: string | null;
  parentId: string | null;
  projectId: string | null;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  labels: string[];
};
export type WorkspaceNote = {
  id: string;
  title: string;
  color: string;
  body: string;
  createdAt: string;
  linkedTaskId: string | null;
  fileUrls: string[];
};
export type WorkspaceProject = { id: string; name: string; identifier: string };
export type WorkspaceTenant = { id: string; slug: string; name: string };
export type InboxItem = {
  channelId: string;
  channelName: string;
  preview: string;
  createdAt: string;
  authorName: string;
  kind: WorkspaceMessage["kind"];
  lastUserId: string;
  unread: boolean;
};

const CHANNEL_LABELS: Record<string, string> = {
  general: "General",
  "meeting-space": "Meeting Space",
  design: "Design",
};

function englishChannelName(slug: string, name: string) {
  if (CHANNEL_LABELS[slug]) return CHANNEL_LABELS[slug];
  if (/[\u0600-\u06FF]/.test(name)) {
    return slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return name;
}

export async function getActiveTenantId() {
  const db = await createServerSupabase();
  const jar = await cookies();
  const fromCookie = jar.get("arka_tenant")?.value;
  if (fromCookie) return fromCookie;
  const { data } = await db.from("workspace_tenants").select("id").order("created_at").limit(1);
  return data?.[0]?.id ? String(data[0].id) : null;
}

export async function listTenants(userId?: string) {
  const db = await createServerSupabase();
  const q = userId
    ? db.from("workspace_tenant_members").select("tenant:workspace_tenants(id, slug, name)").eq("user_id", userId)
    : db.from("workspace_tenants").select("id, slug, name");
  const { data, error } = await q;
  if (error || !data) {
    const fallback = await db.from("workspace_tenants").select("id, slug, name");
    return (fallback.data ?? []).map((row) => ({ id: String(row.id), slug: String(row.slug), name: String(row.name) })) as WorkspaceTenant[];
  }
  return data
    .map((row) => {
      const t = "tenant" in row ? (row.tenant as { id?: string; slug?: string; name?: string } | null) : (row as { id: string; slug: string; name: string });
      if (!t?.id) return null;
      return { id: String(t.id), slug: String(t.slug), name: String(t.name) };
    })
    .filter(Boolean) as WorkspaceTenant[];
}

export async function listProjects() {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_projects").select("id, name, identifier").order("created_at");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => ({ id: String(row.id), name: String(row.name), identifier: String(row.identifier ?? "ARKA") })) as WorkspaceProject[];
}

export async function listChannels(userId?: string) {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_channels").select("id, slug, name, kind").order("created_at");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error) return [];
  let rows = data ?? [];
  if (userId) {
    const members = await db.from("workspace_channel_members").select("channel_id").eq("user_id", userId);
    const allowed = new Set((members.data ?? []).map((m) => String(m.channel_id)));
    rows = rows.filter((row) => row.kind !== "dm" && row.kind !== "private" ? true : allowed.has(String(row.id)));
  }
  return rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: englishChannelName(String(row.slug), String(row.name)),
    kind: String(row.kind),
  })) as WorkspaceChannel[];
}

export async function listMessages(channelId: string, userId?: string, limit = 80) {
  const db = await createServerSupabase();
  const selectFull =
    "id, channel_id, user_id, body, created_at, kind, file_name, file_url, reply_to, author:profiles!user_id(display_name, username, avatar_url)";
  let { data, error } = await db
    .from("workspace_messages")
    .select(selectFull)
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    const fallback = await db
      .from("workspace_messages")
      .select("id, channel_id, user_id, body, created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (fallback.error) return [];
    data = fallback.data as typeof data;
    error = null;
  }
  const rows = (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
  const ids = rows.map((m) => m.id);
  const reactionMap = await loadReactions(ids, userId);
  return rows.map((m) => ({ ...m, reactions: reactionMap.get(m.id) ?? [] }));
}

function mapMessage(rec: Record<string, unknown>): WorkspaceMessage {
  const author = rec.author as { display_name?: string; username?: string; avatar_url?: string | null } | null;
  const kind = rec.kind === "file" || rec.kind === "voice" ? rec.kind : "text";
  return {
    id: String(rec.id),
    channelId: String(rec.channel_id),
    userId: String(rec.user_id),
    body: String(rec.body),
    createdAt: String(rec.created_at),
    kind,
    fileName: rec.file_name ? String(rec.file_name) : null,
    fileUrl: rec.file_url ? String(rec.file_url) : null,
    replyTo: rec.reply_to ? String(rec.reply_to) : null,
    author: {
      displayName: author?.display_name ?? "",
      username: author?.username ?? "",
      avatarUrl: author?.avatar_url ?? null,
    },
    reactions: [],
  };
}

async function loadReactions(messageIds: string[], userId?: string) {
  const map = new Map<string, WorkspaceMessage["reactions"]>();
  if (messageIds.length === 0) return map;
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_reactions").select("message_id, user_id, emoji").in("message_id", messageIds);
  if (error || !data) return map;
  const grouped = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const row of data) {
    const mid = String(row.message_id);
    const emoji = String(row.emoji);
    if (!grouped.has(mid)) grouped.set(mid, new Map());
    const em = grouped.get(mid)!;
    const cur = em.get(emoji) ?? { count: 0, mine: false };
    cur.count += 1;
    if (userId && String(row.user_id) === userId) cur.mine = true;
    em.set(emoji, cur);
  }
  for (const [mid, em] of grouped) {
    map.set(
      mid,
      [...em.entries()].map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
    );
  }
  return map;
}

export async function listInbox(userId?: string) {
  const channels = await listChannels(userId);
  const db = await createServerSupabase();
  const { data } = await db
    .from("workspace_messages")
    .select("id, channel_id, user_id, body, created_at, kind, file_name, author:profiles!user_id(display_name)")
    .order("created_at", { ascending: false })
    .limit(120);
  const seen = new Set<string>();
  const items: InboxItem[] = [];
  for (const row of data ?? []) {
    const channelId = String(row.channel_id);
    if (seen.has(channelId)) continue;
    seen.add(channelId);
    const channel = channels.find((c) => c.id === channelId);
    if (!channel) continue;
    const author = row.author as { display_name?: string } | null;
    const kind = row.kind === "file" || row.kind === "voice" ? row.kind : "text";
    const lastUserId = String(row.user_id);
    items.push({
      channelId,
      channelName: channel.name,
      preview: kind === "file" ? String(row.file_name ?? "Shared a file") : String(row.body),
      createdAt: String(row.created_at),
      authorName: author?.display_name || (lastUserId === userId ? "You" : "Teammate"),
      kind,
      lastUserId,
      unread: Boolean(userId && lastUserId !== userId),
    });
  }
  for (const ch of channels) {
    if (!seen.has(ch.id)) {
      items.push({
        channelId: ch.id,
        channelName: ch.name,
        preview: "No messages yet",
        createdAt: "",
        authorName: "",
        kind: "text",
        lastUserId: "",
        unread: false,
      });
    }
  }
  return items;
}

export async function listMeetings() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_meetings").select("*").order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    startsAt: String(row.starts_at),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    roomName: String(row.room_name),
    createdBy: String(row.created_by),
  })) satisfies WorkspaceMeeting[];
}

export async function getMeeting(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_meetings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: String(data.id),
    title: String(data.title),
    startsAt: String(data.starts_at),
    endsAt: data.ends_at ? String(data.ends_at) : null,
    roomName: String(data.room_name),
    createdBy: String(data.created_by),
  } satisfies WorkspaceMeeting;
}

export async function listTasks() {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_tasks").select("*").order("sort").order("created_at");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: (row.status === "doing" || row.status === "done" ? row.status : "todo") as WorkspaceTask["status"],
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    sort: Number(row.sort ?? 0),
    createdBy: String(row.created_by),
    description: row.description ? String(row.description) : null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    projectId: row.project_id ? String(row.project_id) : null,
    priority: (["low", "medium", "high", "urgent"].includes(String(row.priority)) ? row.priority : "none") as WorkspaceTask["priority"],
    labels: Array.isArray(row.labels) ? row.labels.map(String) : [],
  })) satisfies WorkspaceTask[];
}

export async function listNotes() {
  const db = await createServerSupabase();
  const full = await db.from("workspace_notes").select("id, title, color, body, created_at, linked_task_id, file_urls").order("created_at", { ascending: false });
  const { data, error } = full.error
    ? await db.from("workspace_notes").select("id, title, color, created_at").order("created_at", { ascending: false })
    : full;
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    color: String(row.color ?? "lilac"),
    body: "body" in row && row.body ? String(row.body) : "",
    createdAt: String(row.created_at),
    linkedTaskId: "linked_task_id" in row && row.linked_task_id ? String(row.linked_task_id) : null,
    fileUrls: "file_urls" in row && Array.isArray(row.file_urls) ? row.file_urls.map(String) : [],
  })) satisfies WorkspaceNote[];
}

export async function getNote(id: string) {
  const notes = await listNotes();
  return notes.find((n) => n.id === id) ?? null;
}

export async function listTaskComments(taskId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("workspace_task_comments")
    .select("id, body, created_at, user_id, author:profiles!user_id(display_name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []).map((row) => {
    const author = row.author as { display_name?: string } | null;
    return {
      id: String(row.id),
      body: String(row.body),
      createdAt: String(row.created_at),
      userId: String(row.user_id),
      authorName: author?.display_name ?? "Teammate",
    };
  });
}

export async function listCollaboratorDirectory() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select("id, username, display_name, avatar_url").order("display_name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    username: String(row.username ?? ""),
    displayName: String(row.display_name ?? ""),
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
  }));
}
