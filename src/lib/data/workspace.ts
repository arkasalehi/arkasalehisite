import { createServerSupabase } from "@/lib/supabase/server";

export type WorkspaceChannel = { id: string; slug: string; name: string; kind: string };
export type WorkspaceMessage = {
  id: string;
  channelId: string;
  userId: string;
  body: string;
  createdAt: string;
  author?: { displayName: string; username: string; avatarUrl: string | null };
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
};

export async function listChannels() {
  const db = await createServerSupabase();
  const { data, error } = await db.from("workspace_channels").select("id, slug, name, kind").order("created_at");
  if (error) throw error;
  return (data ?? []) as WorkspaceChannel[];
}

export async function listMessages(channelId: string, limit = 80) {
  const db = await createServerSupabase();
  let query = db
    .from("workspace_messages")
    .select("id, channel_id, user_id, body, created_at, author:profiles!user_id(display_name, username, avatar_url)")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(limit);
  let { data, error } = await query;
  if (error) {
    const fallback = await db
      .from("workspace_messages")
      .select("id, channel_id, user_id, body, created_at")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (fallback.error) throw fallback.error;
    data = fallback.data as typeof data;
    error = null;
  }
  return (data ?? []).map((row) => {
    const rec = row as Record<string, unknown>;
    const author = rec.author as { display_name?: string; username?: string; avatar_url?: string | null } | null;
    return {
      id: String(rec.id),
      channelId: String(rec.channel_id),
      userId: String(rec.user_id),
      body: String(rec.body),
      createdAt: String(rec.created_at),
      author: {
        displayName: author?.display_name ?? "",
        username: author?.username ?? "",
        avatarUrl: author?.avatar_url ?? null,
      },
    } satisfies WorkspaceMessage;
  });
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
  const { data, error } = await db.from("workspace_tasks").select("*").order("sort").order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: (row.status === "doing" || row.status === "done" ? row.status : "todo") as WorkspaceTask["status"],
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    sort: Number(row.sort ?? 0),
    createdBy: String(row.created_by),
  })) satisfies WorkspaceTask[];
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
