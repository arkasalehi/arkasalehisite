export type WsLocale = "en" | "fa";

const EN = {
  inbox: "Inbox",
  tracker: "Tracker",
  chat: "Chat",
  documents: "Documents",
  office: "Office",
  calendar: "Calendar",
  search: "Search · Ctrl K",
  issues: "Issues",
  backlog: "Backlog",
  active: "Active",
  board: "Board",
  newChannel: "New channel",
  newDm: "Direct message",
  invite: "Invite",
  workspace: "Workspace",
  light: "Light",
  dark: "Dark",
  activity: "Activity across Tracker, Chat and Office.",
  unread: "Unread",
  all: "All",
  files: "Files",
  mentions: "Mentions",
  presence: "In room",
  lobby: "In office",
};

const FA: typeof EN = {
  inbox: "صندوق",
  tracker: "پیگیری",
  chat: "گفتگو",
  documents: "اسناد",
  office: "دفتر",
  calendar: "تقویم",
  search: "جستجو · Ctrl K",
  issues: "مسئله‌ها",
  backlog: "بک‌لاگ",
  active: "فعال",
  board: "بورد",
  newChannel: "کانال جدید",
  newDm: "پیام مستقیم",
  invite: "دعوت",
  workspace: "فضای کار",
  light: "روشن",
  dark: "تیره",
  activity: "فعالیت در پیگیری، گفتگو و دفتر.",
  unread: "نخوانده",
  all: "همه",
  files: "فایل‌ها",
  mentions: "منشن",
  presence: "در اتاق",
  lobby: "در دفتر",
};

export function wsCopy(locale: WsLocale) {
  return locale === "fa" ? FA : EN;
}
