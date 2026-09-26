import { chatAvatarColor } from "@/lib/workspace/chat";

export function ChatAvatar({
  name,
  url,
  color,
  size = 44,
}: {
  name: string;
  url?: string | null;
  color?: string;
  size?: number;
}) {
  const bg = color || chatAvatarColor(name || "chat");
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: Math.max(12, size * 0.36) }}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}
