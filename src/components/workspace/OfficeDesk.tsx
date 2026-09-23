"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Folder, Mic, MicOff, Plus, Video, VideoOff, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { formatCallClock } from "@/lib/workspace/callQuality";
import { isAdminRole } from "@/lib/auth/roles";
import { VideoTile } from "@/components/workspace/VideoTile";
import { useCallRoom } from "@/components/workspace/useCallRoom";
import type { WorkspaceNote, WorkspaceProject, WorkspaceTask } from "@/lib/data/workspace";
import { cn } from "@/lib/utils";

type TvState = { kind: string; url: string; title: string } | null;

function kindFromFile(file: File): TvState["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name)) return "office";
  return "link";
}

function TvView({ tv }: { tv: TvState }) {
  if (!tv?.url) {
    return <p className="grid h-36 place-items-center text-[12px] text-white/35">Nothing on TV</p>;
  }
  if (tv.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tv.url} alt="" className="h-40 w-full rounded-xl object-cover" />;
  }
  if (tv.kind === "video") {
    return <video src={tv.url} controls className="h-40 w-full rounded-xl object-cover" />;
  }
  const src =
    tv.kind === "office"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(tv.url)}`
      : tv.kind === "pdf"
        ? tv.url
        : tv.url;
  return <iframe title={tv.title || "TV"} src={src} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" className="h-44 w-full rounded-xl border-0 bg-black" />;
}

export function OfficeDesk({
  projects,
  tasks,
  notes,
  userId,
  displayName,
  avatarUrl,
  role,
}: {
  projects: WorkspaceProject[];
  tasks: WorkspaceTask[];
  notes: WorkspaceNote[];
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [tv, setTv] = useState<TvState>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const [tvLink, setTvLink] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [extraTitles, setExtraTitles] = useState<string[]>([]);
  const admin = isAdminRole(role);
  const project = projects.find((p) => p.id === projectId) ?? projects[0];
  const room = project ? `office-${project.id}` : "office-lobby";
  const call = useCallRoom(room, userId, displayName, { lite: true, avatarUrl });

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!project?.id) return;
    let dead = false;
    void fetch(`/api/workspace/tv?projectId=${project.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!dead && d.tv) setTv(d.tv);
      })
      .catch(() => undefined);
    let supabase: ReturnType<typeof createBrowserSupabase> | null = null;
    try {
      supabase = createBrowserSupabase();
    } catch {
      return () => {
        dead = true;
      };
    }
    const channel = supabase.channel(`arka-tv:${project.id}`);
    channel.on("broadcast", { event: "tv" }, ({ payload }) => {
      setTv((payload as TvState) ?? null);
    });
    void channel.subscribe();
    return () => {
      dead = true;
      void supabase?.removeChannel(channel);
    };
  }, [project?.id]);

  const board = useMemo(
    () => [
      ...extraTitles.map((title, i) => ({ id: `local-${i}`, title, status: "todo" as const, projectId: project?.id ?? null })),
      ...tasks.filter((task) => (!project || task.projectId === project.id || !task.projectId) && task.status !== "done"),
    ].slice(0, 8),
    [extraTitles, project, tasks],
  );
  const docs = useMemo(() => notes.slice(0, 12), [notes]);
  const count = Math.max(call.peopleCount, call.peers.length + 1);
  const elapsed = formatCallClock(now - call.sessionStartedAt);
  const tone = call.grade === "excellent" || call.grade === "good" ? "Good" : call.grade === "fair" ? "Fair" : call.peopleCount > 1 ? "Live" : "Idle";

  const publishTv = useCallback(
    async (next: TvState) => {
      if (!project || !admin) return;
      setTv(next);
      setTvOpen(false);
      await fetch("/api/workspace/tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, ...(next ?? { kind: null, url: null, title: null }) }),
      }).catch(() => undefined);
      try {
        const supabase = createBrowserSupabase();
        await supabase.channel(`arka-tv:${project.id}`).send({ type: "broadcast", event: "tv", payload: next });
      } catch {
        /* live view still updates locally */
      }
    },
    [admin, project],
  );

  async function upload(file: File, asTv: boolean) {
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/workspace/files", { method: "POST", body: form });
    const data = (await res.json().catch(() => ({}))) as { url?: string; name?: string };
    setBusy(false);
    if (!res.ok || !data.url) return;
    if (asTv) {
      await publishTv({ kind: kindFromFile(file), url: data.url, title: data.name || file.name });
      return;
    }
    await fetch("/api/workspace/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: data.name || file.name, fileUrls: [data.url], projectId: project?.id }),
    });
  }

  async function addReminder(title: string) {
    if (!title.trim() || !project) return;
    setExtraTitles((prev) => [title.trim(), ...prev]);
    await fetch("/api/workspace/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), projectId: project.id }),
    });
  }

  return (
    <div className="ws-scroll h-full overflow-auto bg-[#0e1116] px-3 pb-4 pt-2 text-white">
      <div className="mb-2 flex items-center gap-2 text-[12px] text-white/70">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>Online</span>
        <span>
          {count}/{call.maxPeople}
        </span>
        <span className="tabular-nums">{elapsed}</span>
        <span className="text-emerald-300">{tone}</span>
        {projects.length > 1 ? (
          <select className="ms-auto max-w-[40%] bg-transparent text-end text-white/55" value={project?.id} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="ms-auto truncate text-white/40">{project?.name ?? "Studio"}</span>
        )}
      </div>

      {call.error ? <p className="mb-3 rounded-2xl bg-[#1c2128] p-4 text-center text-[13px] text-white/70">{call.error}</p> : null}

      <div className={cn("mb-3 grid gap-2", count <= 1 ? "grid-cols-1" : "grid-cols-2")}>
        <button type="button" className="relative text-start" onClick={call.toggleCam}>
          <VideoTile stream={call.localStream} muted you camOn={call.camOn} label={displayName} avatarUrl={avatarUrl} />
          <span className="absolute end-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white">
            {call.camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </span>
        </button>
        {call.peers.map((peer) => (
          <VideoTile key={peer.id} stream={peer.stream} label={peer.name} camOn={peer.camOn} avatarUrl={peer.avatarUrl} />
        ))}
      </div>
      <div className="mb-3 flex justify-center gap-2">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[#1c2128]" onClick={call.toggleMic} aria-label="Mic">
          {call.micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
      </div>

      <section className="mb-3 rounded-2xl bg-[#1c2128] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-medium">TV</h2>
          {admin ? (
            <button type="button" className="text-[12px] text-white/45" onClick={() => setTvOpen((v) => !v)}>
              {tvOpen ? "Close" : "Share"}
            </button>
          ) : null}
        </div>
        <TvView tv={tv} />
        {tvOpen && admin ? (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const url = tvLink.trim();
              if (!url) return;
              void publishTv({ kind: "link", url, title: "Link" });
              setTvLink("");
            }}
          >
            <input value={tvLink} onChange={(e) => setTvLink(e.target.value)} placeholder="https://…" className="ws-input" />
            <div className="flex gap-2">
              <label className="ws-btn ws-btn-ghost cursor-pointer">
                File
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file, true);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button type="submit" className="ws-btn ws-btn-primary" disabled={busy}>
                Go live
              </button>
              {tv ? (
                <button type="button" className="ws-btn ws-btn-ghost" onClick={() => void publishTv(null)}>
                  Clear
                </button>
              ) : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="mb-3 rounded-2xl bg-[#1c2128] p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-medium">Board</h2>
          <Link href="/ws/tasks" className="text-[12px] text-white/35">
            Open
          </Link>
        </div>
        <ul className="space-y-2 text-end text-[13px] text-white/80">
          {board.length === 0 ? <li className="text-center text-white/35">No reminders</li> : null}
          {board.map((item) => (
            <li key={item.id} className="flex items-center justify-end gap-2">
              <span>{item.title}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("title") as HTMLInputElement;
            void addReminder(input.value);
            input.value = "";
          }}
        >
          <input name="title" className="ws-input flex-1" placeholder="Reminder" />
          <button type="submit" className="grid h-8 w-8 place-items-center rounded-full bg-white/10" aria-label="Add">
            <Plus className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-3 flex gap-2">
          <span className="h-6 w-6 rounded-full bg-[#e07a3a]" />
          <span className="h-6 w-6 rounded-full bg-[#4aa3e0]" />
        </div>
      </section>

      <button type="button" className="flex w-full items-center justify-between rounded-2xl bg-[#1c2128] px-4 py-4" onClick={() => setDocsOpen(true)}>
        <span className="text-[15px] font-medium">Documents</span>
        <Folder className="h-5 w-5 text-white/55" />
      </button>

      {docsOpen ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close" onClick={() => setDocsOpen(false)} />
          <aside className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-auto rounded-t-3xl bg-[#161a20] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-medium">Documents</h2>
              <button type="button" onClick={() => setDocsOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="ws-btn ws-btn-primary mb-3 cursor-pointer">
              Upload any file
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file, false);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <ul className="divide-y divide-white/8">
              {docs.map((note) => (
                <li key={note.id}>
                  <Link href={`/ws/docs/${note.id}`} className="block py-3 text-[14px]" onClick={() => setDocsOpen(false)}>
                    {note.title}
                  </Link>
                </li>
              ))}
              {docs.length === 0 ? <li className="py-6 text-center text-white/40">No files yet</li> : null}
            </ul>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
