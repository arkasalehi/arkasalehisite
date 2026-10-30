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
