"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { Folder, Mic, MicOff, MonitorUp, Moon, PhoneOff, Sun, Video, VideoOff, X } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { isAdminRole } from "@/lib/auth/roles";
import { VideoTile } from "@/components/workspace/VideoTile";
import { useCallRoom } from "@/components/workspace/useCallRoom";
import type { WorkspaceProject } from "@/lib/data/workspace";
import { uploadWorkspaceFile } from "@/lib/workspace/uploadClient";
import { setWsTheme, useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

function formatElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function CallFace({ name, avatar }: { name: string; avatar: string | null }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <span className="relative inline-grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--theme-navpanel-hovered)] text-[10px] font-semibold text-[var(--theme-caption-color)] ring-2 ring-[var(--theme-comp-header-color)] sm:h-8 sm:w-8 sm:text-[12px]" title={name}>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function RoomSheet({
  pane,
  onPane,
  tvLabel,
  boardLabel,
  tv,
  board,
}: {
  pane: "tv" | "board";
  onPane: (next: "tv" | "board") => void;
  tvLabel: string;
  boardLabel: string;
  tv: ReactNode;
  board: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const hRef = useRef(58);
  const laidOut = useRef(false);
  const drag = useRef<{ pointer: number; h: number; moved: boolean; pane: "tv" | "board" | null } | null>(null);
  const ignoreClick = useRef(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const { locale } = useWsChrome();

  useEffect(() => {
    setHost(document.body);
  }, []);

  const apply = useCallback((h: number, snap: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    const peek = Number(el.dataset.peek || 58);
    const max = Number(el.dataset.max || peek);
    const next = Math.min(max, Math.max(peek, h));
    hRef.current = next;
    el.classList.toggle("is-snap", snap);
    el.style.height = `${next}px`;
  }, []);

  const open = useCallback(() => {
    const el = sheetRef.current;
    apply(Number(el?.dataset.max || 320), true);
  }, [apply]);

  const layout = useCallback(() => {
    const el = sheetRef.current;
    if (!el || drag.current) return;
    const bar = document.querySelector(".ws-room-bar") as HTMLElement | null;
    const tiles = document.querySelector(".ws-room-tiles") as HTMLElement | null;
    const barH = Math.round(bar?.getBoundingClientRect().height ?? 72);
    let top = 72;
    if (tiles) {
      const articles = tiles.querySelectorAll("article");
      let bottom = 0;
      articles.forEach((node) => {
        bottom = Math.max(bottom, node.getBoundingClientRect().bottom);
      });
      top = (bottom || tiles.getBoundingClientRect().bottom) + 10;
    }
    const peek = 58;
    const max = Math.max(peek, Math.round(window.innerHeight - barH - top));
    const prevPeek = Number(el.dataset.peek || peek);
    const wasPeek = !laidOut.current || Math.abs(hRef.current - prevPeek) < 8;
    el.style.bottom = `${barH}px`;
    el.dataset.peek = String(peek);
    el.dataset.max = String(max);
    el.classList.add("is-ready");
    laidOut.current = true;
    if (wasPeek) {
      apply(peek, false);
      return;
    }
    apply(Math.min(hRef.current, max), false);
  }, [apply]);

  useLayoutEffect(() => {
    if (!host) return;
    layout();
    const extra = window.requestAnimationFrame(() => layout());
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => layout());
    const bar = document.querySelector(".ws-room-bar");
    const tiles = document.querySelector(".ws-room-tiles");
    if (bar) ro.observe(bar);
    if (tiles) ro.observe(tiles);
    return () => {
      window.cancelAnimationFrame(extra);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [host, layout]);

  useEffect(() => {
    const move = (e: globalThis.PointerEvent) => {
      const state = drag.current;
      if (!state) return;
      const dy = state.pointer - e.clientY;
      if (Math.abs(dy) > 6) state.moved = true;
      apply(state.h + dy, false);
    };
    const up = () => {
      const state = drag.current;
      drag.current = null;
      if (!state) return;
      const el = sheetRef.current;
      const peek = Number(el?.dataset.peek || 58);
      const max = Number(el?.dataset.max || peek);
      if (state.moved) {
        ignoreClick.current = true;
        window.setTimeout(() => {
          ignoreClick.current = false;
        }, 400);
        let h = hRef.current;
        if (h < peek + 40) h = peek;
        else if (h > max - 40) h = max;
        apply(h, true);
        return;
      }
      if (state.pane) {
        ignoreClick.current = true;
        window.setTimeout(() => {
          ignoreClick.current = false;
        }, 400);
        onPane(state.pane);
        open();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    const head = sheetRef.current?.querySelector(".ws-sheet-head") as HTMLElement | null;
    const block = (e: Event) => {
      if (drag.current) e.preventDefault();
    };
    head?.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      head?.removeEventListener("touchmove", block);
    };
  }, [apply, host, onPane, open]);

  function onDown(e: PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement | null;
    const paneBtn = target?.closest("[data-pane]")?.getAttribute("data-pane");
    drag.current = {
      pointer: e.clientY,
      h: hRef.current,
      moved: false,
      pane: paneBtn === "tv" || paneBtn === "board" ? paneBtn : null,
    };
    sheetRef.current?.classList.remove("is-snap");
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is optional; window listeners still drag */
    }
  }

  if (!host) return null;

  return createPortal(
    <aside
      ref={sheetRef}
      className="ws-sheet"
      dir={locale === "fa" ? "rtl" : "ltr"}
      lang={locale}
      aria-label="TV and Board"
    >
      <div className="ws-sheet-head" onPointerDown={onDown}>
        <span className="ws-sheet-pill" />
        <div className="flex">
          <button
            type="button"
            data-pane="tv"
            className={cn("flex-1 py-2.5 text-[13px] font-semibold", pane === "tv" ? "text-[var(--theme-caption-color)]" : "text-[var(--theme-darker-color)]")}
            onClick={() => {
              if (ignoreClick.current) return;
              onPane("tv");
              open();
            }}
          >
            {tvLabel}
          </button>
          <button
            type="button"
            data-pane="board"
            className={cn("flex-1 py-2.5 text-[13px] font-semibold", pane === "board" ? "text-[var(--theme-caption-color)]" : "text-[var(--theme-darker-color)]")}
            onClick={() => {
              if (ignoreClick.current) return;
              onPane("board");
              open();
            }}
          >
            {boardLabel}
          </button>
        </div>
      </div>
      <div className={cn("ws-sheet-body", pane === "tv" ? "is-tv" : "is-board")}>{pane === "tv" ? tv : board}</div>
    </aside>,
    host,
  );
}

type TvClip = { kind: string; url: string; title: string };
type TvState = TvClip | null;

function kindFromFile(file: File): TvClip["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(file.name)) return "office";
  return "link";
}

function TvView({ tv, empty, title }: { tv: TvState; empty: string; title: string }) {
  if (!tv?.url) {
    return <p className="grid h-full place-items-center px-3 text-[13px] text-[var(--theme-darker-color)]">{empty}</p>;
  }
  if (tv.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tv.url} alt="" className="h-full w-full object-contain" />;
  }
  if (tv.kind === "video") {
    return <video src={tv.url} controls className="h-full w-full object-contain" />;
  }
  const src =
    tv.kind === "office"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(tv.url)}`
      : tv.url;
  return <iframe title={tv.title || title} src={src} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" className="h-full w-full border-0 bg-white" />;
}

function Ctrl({
  label,
  onClick,
  active,
  danger,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  active?: boolean;
  danger?: boolean;
  href?: string;
  children: ReactNode;
}) {
  const className = cn(
    "flex flex-col items-center gap-1 text-[11px] text-[var(--theme-content-color)]",
    danger && "text-white",
  );
  const btn = cn(
    "grid h-11 w-11 place-items-center rounded-full sm:h-12 sm:w-12",
    danger
      ? "bg-[#e53935] text-white"
      : active
        ? "bg-[var(--theme-caption-color)] text-[var(--theme-back-color)]"
        : "bg-[var(--ws-gray-4)] text-[var(--theme-caption-color)] hover:bg-[var(--ws-gray-5)]",
  );
  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className} aria-label={label}>
        <span className={btn}>{children}</span>
        <span className="hidden sm:block">{label}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      <span className={btn}>{children}</span>
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}

export function OfficeDesk({
  roomName,
  title,
  meetingId,
  projects,
  lockedProjectId = null,
  boardBody = "",
  projectStatus = "active",
  userId,
  displayName,
  avatarUrl,
  role,
}: {
  roomName: string;
  title: string;
  meetingId: string;
  projects: WorkspaceProject[];
  lockedProjectId?: string | null;
  boardBody?: string;
  projectStatus?: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}) {
  const [projectId, setProjectId] = useState(lockedProjectId || "");
  const [tv, setTv] = useState<TvState>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [tvOpen, setTvOpen] = useState(false);
  const [tvLink, setTvLink] = useState("");
  const [notes, setNotes] = useState(boardBody);
  const [files, setFiles] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [pane, setPane] = useState<"tv" | "board">("tv");
  const { theme, t } = useWsChrome();
  const admin = isAdminRole(role);
  const project = projects.find((p) => p.id === (lockedProjectId || projectId)) ?? null;
  const writable = projectStatus === "active" && Boolean(project?.id);
  const call = useCallRoom(roomName, userId, displayName, { lite: true, avatarUrl });

  useEffect(() => {
    if (lockedProjectId) setProjectId(lockedProjectId);
  }, [lockedProjectId]);

  useEffect(() => {
    setNotes(boardBody);
  }, [boardBody]);

  useEffect(() => {
    if (!docsOpen || !project?.id) return;
    let live = true;
    void fetch(`/api/workspace/project-files?projectId=${project.id}`)
      .then((res) => res.json())
      .then((data: { files?: Array<{ id: string; name: string; url: string }> }) => {
        if (live && Array.isArray(data.files)) setFiles(data.files);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [docsOpen, project?.id]);

  useEffect(() => {
    void fetch("/api/workspace/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", meetingId }),
    });
    return () => {
      void fetch("/api/workspace/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", meetingId }),
      });
    };
  }, [meetingId]);

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

  const docs = files;
  const count = Math.max(call.peopleCount, call.peers.length + 1);
  const present = useMemo(
    () => [
      { id: userId, name: displayName, avatar: avatarUrl },
      ...call.peers.map((peer) => ({ id: peer.id, name: peer.name, avatar: peer.avatarUrl })),
    ],
    [avatarUrl, call.peers, displayName, userId],
  );
  const shownFaces = present.slice(0, 4);
  const extraFaces = present.length - shownFaces.length;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [call.sessionStartedAt]);
  const elapsed = formatElapsed(now - call.sessionStartedAt);

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
    try {
      const data = await uploadWorkspaceFile(file);
      if (asTv) {
        await publishTv({ kind: kindFromFile(file), url: data.url, title: data.name || file.name });
        return;
      }
      await fetch("/api/workspace/project-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project?.id, name: data.name || file.name, url: data.url, mime: file.type, sizeBytes: file.size }),
      });
      setFiles((prev) => [{ id: data.url, name: data.name || file.name, url: data.url }, ...prev]);
    } catch {
      /* keep current TV/docs */
    } finally {
      setBusy(false);
    }
  }

  async function saveBoard() {
    if (!writable || !project?.id) return;
    setBusy(true);
    await fetch("/api/workspace/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.id, boardBody: notes }),
    });
    setBusy(false);
  }

  const renderTvPane = () => (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <h2 className="text-[16px] font-semibold text-[var(--theme-caption-color)]">{t.tv}</h2>
        {admin ? (
          <button type="button" className="text-[12px] text-[var(--theme-link-color)]" onClick={() => setTvOpen((v) => !v)}>
            {tvOpen ? t.closeShare : t.share}
          </button>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-3">
        <div className="ws-room-media rounded-lg bg-[var(--input-BackgroundColor)]">
          <div className="ws-room-media-fill">
            <TvView tv={tv} empty={t.nothingOnTv} title={t.tv} />
          </div>
        </div>
      </div>
      {tvOpen && admin ? (
        <form
          className="shrink-0 space-y-2 px-3 pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            const url = tvLink.trim();
            if (!url) return;
            void publishTv({ kind: "link", url, title: "Link" });
            setTvLink("");
          }}
        >
          <input value={tvLink} onChange={(e) => setTvLink(e.target.value)} placeholder="https://…" className="ws-input min-w-0 text-[var(--theme-caption-color)]" />
          <div className="flex flex-wrap gap-2">
            <label className="ws-btn ws-btn-ghost cursor-pointer text-[var(--theme-caption-color)]">
              {t.file}
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
              {t.goLive}
            </button>
            {tv ? (
              <button type="button" className="ws-btn ws-btn-ghost text-[var(--theme-caption-color)]" onClick={() => void publishTv(null)}>
                {t.clear}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );

  const renderBoardPane = () => (
    <section className="flex h-full min-h-0 flex-col overflow-hidden lg:border-t lg:border-[var(--theme-divider-color)]">
      <div className="flex shrink-0 items-center justify-between px-4 py-2">
        <h2 className="text-[16px] font-semibold text-[var(--theme-caption-color)]">{t.board}</h2>
        {writable ? (
          <button type="button" className="text-[12px] text-[var(--theme-link-color)]" disabled={busy} onClick={() => void saveBoard()}>
            {busy ? t.saving : t.save}
          </button>
        ) : (
          <Link href="/ws" className="text-[12px] text-[var(--theme-link-color)]">
            {t.open}
          </Link>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          readOnly={!writable}
          placeholder={t.boardNotes}
          className="h-full min-h-40 w-full resize-none bg-transparent text-[13px] leading-6 text-[var(--theme-content-color)] outline-none"
        />
      </div>
    </section>
  );

  return (
    <div className="ws-room bg-[var(--theme-back-color)] text-[var(--theme-caption-color)]">
      <div className="ws-room-grid">
      <header className="ws-room-top">
        <div className="flex min-w-0 items-center gap-2.5 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="flex shrink-0 items-center">
            {shownFaces.map((person, i) => (
              <span key={person.id} className={i ? "-ms-2" : undefined}>
                <CallFace name={person.name} avatar={person.avatar} />
              </span>
            ))}
            {extraFaces > 0 ? <span className="ms-1.5 text-[11px] text-[var(--theme-darker-color)]">+{extraFaces}</span> : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[13px] font-semibold leading-tight sm:text-[15px]">{title}</h1>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--theme-darker-color)]">
              <span>{t.callRoom} {roomName}</span>
              <span className="mx-1.5 text-[var(--theme-divider-color)]">·</span>
              <span>
                {present.length} {t.online}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 tabular-nums text-[12px] font-medium sm:text-[13px]" aria-label={elapsed}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#5ea882]" />
            <span>{elapsed}</span>
          </div>
        </div>
      </header>

      <div className="ws-room-stage relative flex h-full min-h-0 flex-col overflow-hidden p-2 pb-0 lg:pe-1 lg:pb-2">
        {call.error ? <p className="mb-2 shrink-0 rounded-xl bg-[var(--theme-navpanel-hovered)] p-3 text-center text-[13px] text-[var(--theme-content-color)]">{call.error}</p> : null}
        <div className={cn("ws-room-tiles min-h-0 lg:flex-1", count <= 1 ? "grid-cols-1" : "grid-cols-2")}>
          <VideoTile fill landscape={count <= 1} stream={call.localStream} muted you youLabel={t.you} camOn={call.camOn} micOn={call.micOn} label={displayName} avatarUrl={avatarUrl} />
          {call.peers.map((peer, i) => (
            <VideoTile key={peer.id} fill wide={count === 3 && i === 1} stream={peer.stream} label={peer.name} camOn={peer.camOn} avatarUrl={peer.avatarUrl} />
          ))}
        </div>
      </div>

      <aside className="ws-room-side mx-2 mb-2 hidden flex-col overflow-hidden rounded-xl border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] lg:me-2 lg:ms-1 lg:mt-2 lg:mb-2 lg:flex">
        <div className="grid min-h-0 flex-1 grid-rows-2 overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">{renderTvPane()}</div>
          <div className="h-full min-h-0 overflow-hidden">{renderBoardPane()}</div>
        </div>
      </aside>

      <div className="ws-room-bar relative z-50 flex items-center justify-center gap-3 border-t border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-4">
        <Ctrl label={call.micOn ? t.mute : t.unmute} onClick={call.toggleMic} active={!call.micOn}>
          {call.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Ctrl>
        <Ctrl label={call.camOn ? t.stopVideo : t.startVideo} onClick={call.toggleCam} active={!call.camOn}>
          {call.camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Ctrl>
        <Ctrl label={t.share} onClick={() => void call.toggleShare()} active={call.sharing}>
          <MonitorUp className="h-5 w-5" />
        </Ctrl>
        <Ctrl label={t.leave} href="/ws/meet" danger onClick={() => call.hangUp()}>
          <PhoneOff className="h-5 w-5" />
        </Ctrl>
        <Ctrl label={t.docs} onClick={() => setDocsOpen(true)}>
          <Folder className="h-5 w-5" />
        </Ctrl>
        <Ctrl
          label={theme === "dark" ? t.light : t.dark}
          onClick={() => setWsTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Ctrl>
      </div>
      </div>

      <RoomSheet pane={pane} onPane={setPane} tvLabel={t.tv} boardLabel={t.board} tv={renderTvPane()} board={renderBoardPane()} />

      {docsOpen
        ? createPortal(
            <div className="fixed inset-0 z-[100]">
              <button type="button" className="absolute inset-0 bg-black/55" aria-label={t.close} onClick={() => setDocsOpen(false)} />
              <aside className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-auto rounded-t-3xl bg-[var(--theme-comp-header-color)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[var(--theme-caption-color)]">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[16px] font-medium">{t.documents}</h2>
                  <button type="button" onClick={() => setDocsOpen(false)} aria-label={t.close}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {projects.length > 1 && !lockedProjectId ? (
                  <select className="mb-3 w-full bg-transparent text-[13px] text-[var(--theme-darker-color)]" value={project?.id} onChange={(e) => setProjectId(e.target.value)}>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                {writable ? (
                <label className="ws-btn ws-btn-primary mb-3 cursor-pointer">
                  {t.uploadFile}
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
                ) : null}
                <ul className="divide-y divide-[var(--theme-divider-color)]">
                  {docs.map((file) => (
                    <li key={file.id}>
                      <a href={file.url} target="_blank" rel="noreferrer" className="block py-3 text-[14px]" onClick={() => setDocsOpen(false)}>
                        {file.name}
                      </a>
                    </li>
                  ))}
                  {docs.length === 0 ? <li className="py-6 text-center text-[var(--theme-darker-color)]">{t.noFiles}</li> : null}
                </ul>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
