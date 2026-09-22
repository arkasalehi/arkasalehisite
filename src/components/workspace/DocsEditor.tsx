"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { WorkspaceNote, WorkspaceTask } from "@/lib/data/workspace";

async function uploadFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/workspace/files", { method: "POST", body: form });
  return (await res.json()) as { url?: string; name?: string };
}

export function DocsEditor({ note, tasks }: { note: WorkspaceNote | null; tasks: WorkspaceTask[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [slash, setSlash] = useState(false);
  const [linked, setLinked] = useState(note?.linkedTaskId ?? "");
  const [files, setFiles] = useState<string[]>(note?.fileUrls ?? []);
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  function applySlash(cmd: string) {
    setSlash(false);
    if (cmd === "h1") setBody((v) => `${v}\n# `);
    if (cmd === "list") setBody((v) => `${v}\n- `);
    if (cmd === "issue") setBody((v) => `${v}\n[issue]: `);
    area.current?.focus();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const payload = { title, body, linkedTaskId: linked || null, fileUrls: files };
    if (!note) {
      const res = await fetch("/api/workspace/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSaving(false);
      if (res.ok && data.id) router.push(`/ws/docs/${data.id}`);
      return;
    }
    await fetch("/api/workspace/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, ...payload }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="relative flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 overflow-x-auto border-b border-[var(--theme-divider-color)] px-3 text-[12px] sm:px-4">
        <button type="button" className="rounded px-2 py-1 hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setBody((v) => `**${v}**`)}>
          B
        </button>
        <button type="button" className="rounded px-2 py-1 italic hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => setBody((v) => `_${v}_`)}>
          I
        </button>
        <button type="button" className="rounded px-2 py-1 hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => applySlash("list")}>
          List
        </button>
        <label className="ms-auto hidden text-[var(--theme-darker-color)] sm:block">
          Linked issue
          <select className="ms-2 h-7 rounded-[var(--ws-radius)] bg-[var(--input-BackgroundColor)] px-1" value={linked} onChange={(e) => setLinked(e.target.value)}>
            <option value="">None</option>
            {tasks.filter((t) => !t.parentId).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <label className="cursor-pointer text-[var(--theme-link-color)]">
          Attach
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              void uploadFile(file).then((up) => {
                if (up.url) setFiles((prev) => [...prev, up.url!]);
              });
            }}
          />
        </label>
        <button type="submit" disabled={saving} className="ws-btn ws-btn-ghost text-[var(--ws-accent)]">
          {saving ? <span className="ws-spinner" /> : "Save"}
        </button>
      </div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent px-6 py-4 text-[length:var(--ws-type-xl)] font-semibold tracking-[var(--ws-tracking-heading)] outline-none" placeholder="Untitled" />
      <textarea
        ref={area}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setSlash(e.target.value.endsWith("/"));
        }}
        className="min-h-0 flex-1 resize-none bg-transparent px-6 pb-8 text-[length:var(--ws-type-md)] leading-[var(--ws-leading-body)] text-[var(--theme-content-color)] outline-none"
        placeholder="Type / for heading, list, or issue link…"
      />
      {slash ? (
        <div className="absolute bottom-24 start-6 w-48 overflow-hidden rounded-[var(--ws-radius)] border border-[var(--theme-divider-color)] bg-[var(--theme-comp-header-color)] text-[length:var(--ws-type-sm)]">
          <button type="button" className="block w-full px-3 py-2 text-start hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => applySlash("h1")}>
            Heading
          </button>
          <button type="button" className="block w-full px-3 py-2 text-start hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => applySlash("list")}>
            Bullet list
          </button>
          <button type="button" className="block w-full px-3 py-2 text-start hover:bg-[var(--theme-navpanel-hovered)]" onClick={() => applySlash("issue")}>
            Link issue
          </button>
        </div>
      ) : null}
      {files.length ? (
        <div className="border-t border-[var(--theme-divider-color)] px-6 py-2 text-[12px]">
          {files.map((f) => (
            <a key={f} href={f} className="me-3 text-[var(--ws-accent)]" target="_blank" rel="noreferrer">
              {f.split("/").pop()}
            </a>
          ))}
        </div>
      ) : null}
    </form>
  );
}
