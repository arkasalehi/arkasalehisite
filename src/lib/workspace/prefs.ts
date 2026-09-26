export type ChatPrefs = { enterToSend: boolean; sound: boolean; compact: boolean };
export type NotifyPrefs = { inbox: boolean; mentions: boolean; tasks: boolean; meetings: boolean };
export type PrivacyPrefs = { readReceipts: boolean; anyoneCanDm: boolean };

const CHAT_KEY = "ws-chat-prefs";
const NOTIFY_KEY = "ws-notify-prefs";
const PRIVACY_KEY = "ws-privacy-prefs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}

export const defaultChatPrefs: ChatPrefs = { enterToSend: true, sound: true, compact: false };
export const defaultNotifyPrefs: NotifyPrefs = { inbox: true, mentions: true, tasks: true, meetings: true };
export const defaultPrivacyPrefs: PrivacyPrefs = { readReceipts: true, anyoneCanDm: true };

export function loadChatPrefs() {
  return read(CHAT_KEY, defaultChatPrefs);
}
export function saveChatPrefs(value: ChatPrefs) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(value));
}
export function loadNotifyPrefs() {
  return read(NOTIFY_KEY, defaultNotifyPrefs);
}
export function saveNotifyPrefs(value: NotifyPrefs) {
  localStorage.setItem(NOTIFY_KEY, JSON.stringify(value));
}
export function loadPrivacyPrefs() {
  return read(PRIVACY_KEY, defaultPrivacyPrefs);
}
export function savePrivacyPrefs(value: PrivacyPrefs) {
  localStorage.setItem(PRIVACY_KEY, JSON.stringify(value));
}
