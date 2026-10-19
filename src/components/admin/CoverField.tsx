"use client";

import { useState } from "react";

export function CoverField({ initial }: { initial?: string | null }) {
  const [url, setUrl] = useState(initial ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const blob = await cropCover(file);
      const body = new FormData();
      body.set("file", blob, "cover.jpg");
      const res = await fetch("/api/admin/media", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "آپلود نشد");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("برش تصویر انجام نشد");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm text-muted">تصویر جلد</span>
      <input type="hidden" name="coverImage" value={url} />
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-foreground/[0.04]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="پیش‌نمایش برش جلد" className="absolute inset-0 h-full w-full object-cover object-center" />
        ) : (
          <span className="grid h-full place-items-center px-4 text-center text-sm text-muted">برش ۱۶:۱۰ بعد از انتخاب فایل</span>
        )}
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">آدرس تصویر</span>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
          className="field"
          inputMode="url"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">آپلود و برش</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-muted file:me-3 file:rounded-md file:border-0 file:bg-foreground/8 file:px-3 file:py-2 file:text-foreground"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </label>
      {busy ? <p className="text-sm text-muted">در حال برش و آپلود…</p> : null}
      {error ? <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
    </div>
  );
}

function cropCover(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const targetW = 1600;
      const targetH = 1000;
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("canvas"));
        return;
      }
      const scale = Math.max(targetW / img.width, targetH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (targetW - w) / 2, (targetH - h) / 2, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("blob"));
        },
        "image/jpeg",
        0.86,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image"));
    };
    img.src = objectUrl;
  });
}
