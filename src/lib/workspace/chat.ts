import type { WsLocale } from "@/lib/workspace/copy";

export const CHAT_PAGE_SIZE = 50;

const AVATAR_COLORS = ["#3390EC", "#64B5F6", "#4DB6AC", "#7E57C2", "#4CAF50", "#EC407A", "#5C6BC0", "#26A69A"];

export function chatAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

export function formatChatWhen(iso: string, locale: WsLocale) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (mins < 1) return locale === "fa" ? "همین حالا" : "just now";
  if (mins < 60) return locale === "fa" ? `${mins} دقیقه پیش` : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return locale === "fa" ? `${hours} ساعت پیش` : `${hours} h ago`;
  return date.toLocaleDateString(locale === "fa" ? "fa-IR" : "en-US", { month: "short", day: "numeric" });
}

export function chatPreviewText(kind: string, body: string, fileName?: string | null) {
  if (kind === "file") return fileName || body || "Shared a file";
  if (kind === "voice") return "Voice note";
  return body;
}
