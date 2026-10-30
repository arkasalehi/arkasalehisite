/** Reserved workspace assistant. Not a human collaborator. */
export const WPBOT_USERNAME = "wpbot";

/**
 * Viewer gate for wpbot.
 * `role: "admin"` is a regular admin and is not enough.
 * Only `isSuperAdmin` (the owner flag) may see the bot.
 */
export type BotViewer = { role?: string | null; isSuperAdmin?: boolean } | null | undefined;

export type BotIdentity = {
  username?: string | null;
  slug?: string | null;
  kind?: string | null;
  channelKind?: string | null;
  channelName?: string | null;
  displayName?: string | null;
  name?: string | null;
};

export function canSeeHiddenBots(viewer: BotViewer): boolean {
  return viewer?.isSuperAdmin === true;
}

function handle(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** True when this row is the hidden assistant, by handle or bot kind. */
export function isHiddenBotIdentity(value: BotIdentity | null | undefined): boolean {
  if (!value) return false;
  if (value.kind === "bot" || value.channelKind === "bot") return true;
  const labels = [value.username, value.slug, value.channelName, value.displayName, value.name].map(handle);
  return labels.includes(WPBOT_USERNAME);
}

export function filterHiddenBots<T extends BotIdentity>(rows: T[], viewer: BotViewer): T[] {
  if (canSeeHiddenBots(viewer)) return rows;
  return rows.filter((row) => !isHiddenBotIdentity(row));
}

/** Strip @wpbot mentions from text shown to anyone except the super admin. */
export function redactBotMentions(text: string, viewer: BotViewer): string {
  if (canSeeHiddenBots(viewer) || !text) return text;
  return text.replace(/@wpbot\b/gi, "");
}

/** Identity stored on workspace_bots. There is no image column; avatarUrl stays null unless one is added later. */
export type MessageBot = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type BotAuthor = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

const EMPTY_AUTHOR: BotAuthor = { displayName: "", username: "", avatarUrl: null };

export function botIdFromRow(rec: { bot_id?: unknown; botId?: unknown } | null | undefined): string | null {
  const value = rec?.bot_id ?? rec?.botId;
  if (typeof value !== "string") return null;
  const id = value.trim();
  return id || null;
}

export function readEmbeddedBot(rec: Record<string, unknown> | null | undefined): MessageBot | null {
  if (!rec) return null;
  const raw = rec.bot;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  const bot = row as Record<string, unknown>;
  const id = typeof bot.id === "string" && bot.id ? bot.id : botIdFromRow(rec);
  if (!id) return null;
  const username = typeof bot.username === "string" ? bot.username : "";
  const displayName = typeof bot.display_name === "string" ? bot.display_name : typeof bot.displayName === "string" ? bot.displayName : "";
  return {
    id,
    username,
    displayName,
    avatarUrl: typeof bot.avatar_url === "string" ? bot.avatar_url : typeof bot.avatarUrl === "string" ? bot.avatarUrl : null,
  };
}

/** A bot row is not the viewer's own bubble, even when user_id is their profile. */
export function isOwnChatMessage(message: { botId?: string | null; userId: string }, userId: string): boolean {
  return !message.botId && message.userId === userId;
}

/**
 * Display name and avatar for a bot message.
 * Hidden assistants stay blank for anyone except the super admin, so the owner's profile is not shown either.
 */
export function authorForBot(bot: MessageBot, viewer?: BotViewer): BotAuthor {
  const hidden = !canSeeHiddenBots(viewer) && isHiddenBotIdentity({ username: bot.username, displayName: bot.displayName, kind: "bot" });
  if (hidden) return EMPTY_AUTHOR;
  return {
    displayName: bot.displayName || bot.username,
    username: bot.username,
    avatarUrl: bot.avatarUrl,
  };
}

type BotAuthored = {
  botId: string | null;
  author?: BotAuthor;
};

/** Replace the profile author when bot_id is set. Human messages keep their author, with hidden-bot names stripped. */
export function withBotAuthor<T extends BotAuthored>(message: T, bots: Map<string, MessageBot>, viewer?: BotViewer): T {
  if (!message.botId) {
    if (message.author && !canSeeHiddenBots(viewer) && isHiddenBotIdentity(message.author)) {
      return { ...message, author: EMPTY_AUTHOR };
    }
    return message;
  }
  const known = bots.get(message.botId);
  const embedded: MessageBot = {
    id: message.botId,
    username: message.author?.username ?? "",
    displayName: message.author?.displayName ?? "",
    avatarUrl: message.author?.avatarUrl ?? null,
  };
  const bot = known && (known.displayName || known.username) ? known : embedded.displayName || embedded.username ? embedded : (known ?? embedded);
  return { ...message, author: authorForBot(bot, viewer) };
}

/**
 * Main chat timeline. Human replies (reply_to set, no bot) stay in the side thread.
 * Bot replies are stored with reply_to pointing at the owner message, but they belong inline.
 */
export function showsInMainTimeline(message: { replyTo?: string | null; botId?: string | null }): boolean {
  return !message.replyTo || Boolean(message.botId);
}
