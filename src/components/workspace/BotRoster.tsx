"use client";

import { NoPrefetchLink as Link } from "@/components/NoPrefetchLink";
import { ChatAvatar } from "@/components/workspace/ChatAvatar";
import type { WorkspaceBot } from "@/lib/data/workspace";
import { chatAvatarColor } from "@/lib/workspace/chat";
import { useWsChrome } from "@/lib/theme/workspace";

export function BotRoster({ bots }: { bots: WorkspaceBot[] }) {
  const { t } = useWsChrome();
  return (
    <div className="ws-scroll h-full overflow-auto p-4">
      <h1 className="ws-title">{t.bots}</h1>
      <p className="mt-1 text-[13px] text-[var(--theme-darker-color)]">{t.botOnly}</p>
      {bots.length === 0 ? (
        <p className="px-1 py-16 text-center text-[14px] text-[var(--theme-darker-color)]">
          {t.noBots}
          <span className="mt-1 block text-[13px]">{t.noBotsBody}</span>
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {bots.map((bot) => (
            <li key={bot.id}>
              <Link href={bot.channelId ? `/ws/chat/${bot.channelId}` : "/ws/chat"} className="ws-card flex items-center gap-3">
                <ChatAvatar name={bot.displayName || bot.username} url={bot.avatarUrl} color={chatAvatarColor(bot.id)} size={48} />
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-semibold">{bot.displayName || bot.username}</span>
                  <span className="block text-[12px] text-[var(--theme-darker-color)]">@{bot.username}</span>
                  <span className="mt-1 block text-[13px] text-[var(--theme-dark-color)]">{t.botAssistant}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
