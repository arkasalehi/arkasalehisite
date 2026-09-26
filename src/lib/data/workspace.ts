import { cache } from "react";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { chatAvatarColor, chatPreviewText, CHAT_PAGE_SIZE } from "@/lib/workspace/chat";

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
export type WorkspaceNavNote = { id: string; title: string };
export type WorkspaceNavTask = {
  id: string;
  title: string;
  status: WorkspaceTask["status"];
  parentId: string | null;
  projectId: string | null;
};
export type WorkspaceProject = { id: string; name: string; identifier: string };
export type WorkspaceTenant = { id: string; slug: string; name: string };
export type InboxItem = {
  channelId: string;
  channelName: string;
  channelKind: string;
  preview: string;
  createdAt: string;
  authorName: string;
  kind: WorkspaceMessage["kind"];
  lastUserId: string;
  unread: boolean;
  unreadCount: number;
  avatarUrl: string | null;
  avatarColor: string;
};
export type ChatPerson = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export const NAV_LIMIT = 30;
export const TASK_PAGE_LIMIT = 200;
export const MESSAGE_LIMIT = CHAT_PAGE_SIZE;
export const COMMENT_LIMIT = 80;

const MEETING_COLS = "id, title, starts_at, ends_at, room_name, created_by";
const TASK_COLS = "id, title, status, assignee_id, due_at, sort, created_by, description, parent_id, project_id, priority, labels";
const NAV_TASK_COLS = "id, title, status, parent_id, project_id, sort, created_at";
const NOTE_LIST_COLS = "id, title, color, created_at, linked_task_id, file_urls";
const NOTE_FULL_COLS = `${NOTE_LIST_COLS}, body`;

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

function mapTask(row: Record<string, unknown>): WorkspaceTask {
  return {
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
  };
}

function mapMeeting(row: Record<string, unknown>): WorkspaceMeeting {
  return {
    id: String(row.id),
    title: String(row.title),
    startsAt: String(row.starts_at),
    endsAt: row.ends_at ? String(row.ends_at) : null,
    roomName: String(row.room_name),
    createdBy: String(row.created_by),
  };
}

function mapNoteRow(row: Record<string, unknown>, body = ""): WorkspaceNote {
  return {
    id: String(row.id),
    title: String(row.title),
    color: String(row.color ?? "lilac"),
    body,
    createdAt: String(row.created_at),
    linkedTaskId: row.linked_task_id ? String(row.linked_task_id) : null,
    fileUrls: Array.isArray(row.file_urls) ? row.file_urls.map(String) : [],
  };
}

export const getActiveTenantId = cache(async () => {
  const db = await createServerSupabase();
  const jar = await cookies();
  const fromCookie = jar.get("arka_tenant")?.value;
  if (fromCookie) return fromCookie;
  const { data } = await db.from("workspace_tenants").select("id").order("created_at").limit(1);
  return data?.[0]?.id ? String(data[0].id) : null;
});

export const listTenants = cache(async (userId?: string) => {
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
});

export const listProjects = cache(async () => {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_projects").select("id, name, identifier").order("created_at").limit(50);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((row) => ({ id: String(row.id), name: String(row.name), identifier: String(row.identifier ?? "ARKA") })) as WorkspaceProject[];
});

async function titleDirectChannels(channels: WorkspaceChannel[], userId?: string) {
  if (!userId) return channels;
  const dms = channels.filter((channel) => channel.kind === "dm" || channel.kind === "private");
  if (!dms.length) return channels;
  const db = await createServerSupabase();
  const members = await db.from("workspace_channel_members").select("channel_id, user_id").in(
    "channel_id",
    dms.map((channel) => channel.id),
  );
  const others = (members.data ?? []).filter((row) => String(row.user_id) !== userId);
  const otherIds = [...new Set(others.map((row) => String(row.user_id)))];
  if (!otherIds.length) return channels;
  const profiles = await db.from("profiles").select("id, display_name, username, avatar_url").in("id", otherIds);
  const byId = new Map((profiles.data ?? []).map((row) => [String(row.id), row]));
  const peerByChannel = new Map<string, string>();
  for (const row of others) {
    const channelId = String(row.channel_id);
    if (peerByChannel.has(channelId)) continue;
    const profile = byId.get(String(row.user_id));
    peerByChannel.set(channelId, String(profile?.display_name || profile?.username || "Direct"));
  }
  return channels.map((channel) => {
    const name = peerByChannel.get(channel.id);
    return name ? { ...channel, name } : channel;
  });
}

export const listChannels = cache(async (userId?: string) => {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_channels").select("id, slug, name, kind").order("created_at").limit(80);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error) return [];
  let rows = data ?? [];
  if (userId) {
    const members = await db.from("workspace_channel_members").select("channel_id").eq("user_id", userId);
    const allowed = new Set((members.data ?? []).map((m) => String(m.channel_id)));
    rows = rows.filter((row) => {
      const id = String(row.id);
      if (row.kind === "dm" || row.kind === "private" || row.kind === "group") return allowed.has(id);
      return true;
    });
  }
  const channels = rows.map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    name: row.kind === "group" ? String(row.name) : englishChannelName(String(row.slug), String(row.name)),
    kind: String(row.kind),
  })) as WorkspaceChannel[];
  return titleDirectChannels(channels, userId);
});

export async function listMessages(channelId: string, userId?: string, limit = MESSAGE_LIMIT, before?: string) {
  const db = await createServerSupabase();
  const selectFull =
    "id, channel_id, user_id, body, created_at, kind, file_name, file_url, reply_to, author:profiles!user_id(display_name, username, avatar_url)";
  let query = db.from("workspace_messages").select(selectFull).eq("channel_id", channelId).order("created_at", { ascending: false }).limit(limit);
  if (before) query = query.lt("created_at", before);
  let { data, error } = await query;
  if (error) {
    let fallbackQuery = db
      .from("workspace_messages")
      .select("id, channel_id, user_id, body, created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (before) fallbackQuery = fallbackQuery.lt("created_at", before);
    const fallback = await fallbackQuery;
    if (fallback.error) return [];
    data = fallback.data as typeof data;
    error = null;
  }
  const rows = (data ?? []).map((row) => mapMessage(row as Record<string, unknown>)).reverse();
  const ids = rows.map((m) => m.id);
  const reactionMap = await loadReactions(ids, userId);
  return rows.map((m) => ({ ...m, reactions: reactionMap.get(m.id) ?? [] }));
}

export function mapMessage(rec: Record<string, unknown>): WorkspaceMessage {
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
  const { data, error } = await db
    .from("workspace_reactions")
    .select("message_id, user_id, emoji")
    .in("message_id", messageIds)
    .limit(400);
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

export const listInbox = cache(async (userId?: string) => {
  const channels = await listChannels(userId);
  if (!channels.length) return [] as InboxItem[];
  const db = await createServerSupabase();
  const ids = channels.map((channel) => channel.id);
  let previews: Array<Record<string, unknown>> = [];
  const rpc = await db.rpc("workspace_channel_previews");
  if (!rpc.error && Array.isArray(rpc.data)) {
    previews = (rpc.data as Array<Record<string, unknown>>).filter((row) => ids.includes(String(row.channel_id)));
  } else {
    const fallback = await db
      .from("workspace_messages")
      .select("channel_id, user_id, body, created_at, kind, file_name")
      .in("channel_id", ids)
      .order("created_at", { ascending: false })
      .limit(240);
    const seen = new Set<string>();
    for (const row of fallback.data ?? []) {
      const channelId = String(row.channel_id);
      if (seen.has(channelId)) continue;
      seen.add(channelId);
      previews.push(row as Record<string, unknown>);
    }
  }

  const reads = new Map<string, string>();
  if (userId) {
    const readRows = await db.from("workspace_channel_reads").select("channel_id, last_read_at").eq("user_id", userId);
    if (!readRows.error) {
      for (const row of readRows.data ?? []) reads.set(String(row.channel_id), String(row.last_read_at));
    }
  }

  const latest = new Map<string, Record<string, unknown>>();
  for (const row of previews) latest.set(String(row.channel_id), row);

  const authorIds = [...new Set(previews.map((row) => String(row.user_id)))];
  const authors = authorIds.length
    ? await db.from("profiles").select("id, display_name, username, avatar_url").in("id", authorIds)
    : { data: [] as Array<{ id: unknown; display_name?: unknown; username?: unknown; avatar_url?: unknown }> };
  const authorMap = new Map(
    (authors.data ?? []).map((row) => [
      String(row.id),
      {
        name: String(row.display_name || row.username || ""),
        avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      },
    ]),
  );

  const dmIds = channels.filter((channel) => channel.kind === "dm" || channel.kind === "private").map((channel) => channel.id);
  const peerByChannel = new Map<string, { name: string; avatarUrl: string | null; userId: string }>();
  if (userId && dmIds.length) {
    const members = await db.from("workspace_channel_members").select("channel_id, user_id").in("channel_id", dmIds);
    const others = (members.data ?? []).filter((row) => String(row.user_id) !== userId);
    const otherIds = [...new Set(others.map((row) => String(row.user_id)))];
    const profiles = otherIds.length
      ? await db.from("profiles").select("id, display_name, username, avatar_url").in("id", otherIds)
      : { data: [] as Array<{ id: unknown; display_name?: unknown; username?: unknown; avatar_url?: unknown }> };
    const byId = new Map((profiles.data ?? []).map((row) => [String(row.id), row]));
    for (const row of others) {
      const channelId = String(row.channel_id);
      if (peerByChannel.has(channelId)) continue;
      const profile = byId.get(String(row.user_id));
      peerByChannel.set(channelId, {
        name: String(profile?.display_name || profile?.username || "Direct"),
        avatarUrl: typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
        userId: String(row.user_id),
      });
    }
  }

  const items: InboxItem[] = [];
  for (const channel of channels) {
    const row = latest.get(channel.id);
    if (!row) continue;
    const kind = row.kind === "file" || row.kind === "voice" ? row.kind : "text";
    const lastUserId = String(row.user_id);
    const createdAt = String(row.created_at);
    const peer = peerByChannel.get(channel.id);
    const author = authorMap.get(lastUserId);
    const lastRead = reads.get(channel.id);
    const unread = Boolean(userId && lastUserId !== userId && (!lastRead || createdAt > lastRead));
    items.push({
      channelId: channel.id,
      channelName: peer?.name || channel.name,
      channelKind: channel.kind,
      preview: chatPreviewText(kind, String(row.body ?? ""), row.file_name ? String(row.file_name) : null),
      createdAt,
      authorName: lastUserId === userId ? "You" : author?.name || "Teammate",
      kind,
      lastUserId,
      unread,
      unreadCount: unread ? 1 : 0,
      avatarUrl: peer?.avatarUrl ?? (channel.kind === "dm" ? author?.avatarUrl ?? null : null),
      avatarColor: chatAvatarColor(peer?.userId || channel.id),
    });
  }
  items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return items;
});

export const listNavMeetings = cache(async () => {
  const rows = await listMeetings(NAV_LIMIT);
  return rows;
});

export const listMeetings = cache(async (take = 50) => {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_meetings").select(MEETING_COLS).order("starts_at", { ascending: true }).limit(take);
  if (error) throw error;
  return (data ?? []).map((row) => mapMeeting(row as Record<string, unknown>));
});

export async function getMeeting(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_meetings").select(MEETING_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapMeeting(data as Record<string, unknown>);
}

export const listNavTasks = cache(async () => {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_tasks").select(NAV_TASK_COLS).order("sort").order("created_at").limit(NAV_LIMIT);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error || !data) return [] as WorkspaceNavTask[];
  return data.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: (row.status === "doing" || row.status === "done" ? row.status : "todo") as WorkspaceTask["status"],
    parentId: row.parent_id ? String(row.parent_id) : null,
    projectId: row.project_id ? String(row.project_id) : null,
  }));
});

export const listTasks = cache(async (take = TASK_PAGE_LIMIT) => {
  const db = await createServerSupabase();
  const tenantId = await getActiveTenantId();
  let q = db.from("workspace_tasks").select(TASK_COLS).order("sort").order("created_at").limit(take);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => mapTask(row as Record<string, unknown>));
});

export const listNavNotes = cache(async () => {
  const notes = await listNotes(NAV_LIMIT);
  return notes.map((note) => ({ id: note.id, title: note.title }));
});

export const listNotes = cache(async (take = NAV_LIMIT) => {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_notes").select(NOTE_LIST_COLS).order("created_at", { ascending: false }).limit(take);
  if (error || !data) return [] as WorkspaceNote[];
  return data.map((row) => mapNoteRow(row as Record<string, unknown>));
});

export async function getNote(id: string) {
  const db = await createServerSupabase();
  const full = await db.from("workspace_notes").select(NOTE_FULL_COLS).eq("id", id).maybeSingle();
  if (!full.error && full.data) {
    const row = full.data as Record<string, unknown>;
    return mapNoteRow(row, row.body ? String(row.body) : "");
  }
  const lite = await db.from("workspace_notes").select("id, title, color, created_at").eq("id", id).maybeSingle();
  if (lite.error || !lite.data) return null;
  return mapNoteRow(lite.data as Record<string, unknown>);
}

export async function listTaskComments(taskId: string) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("workspace_task_comments")
    .select("id, body, created_at, user_id, author:profiles!user_id(display_name)")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })
    .limit(COMMENT_LIMIT);
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

export const listCollaboratorDirectory = cache(async () => {
  const db = await createServerSupabase();
  const { data, error } = await db.from("profiles").select("id, username, display_name, avatar_url").order("display_name").limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    username: String(row.username ?? ""),
    displayName: String(row.display_name ?? ""),
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
  }));
});
