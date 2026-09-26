"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, MoreHorizontal, X } from "lucide-react";
import { uploadWorkspaceFile } from "@/lib/workspace/uploadClient";
import {
  loadChatPrefs,
  loadNotifyPrefs,
  loadPrivacyPrefs,
  saveChatPrefs,
  saveNotifyPrefs,
  savePrivacyPrefs,
  type ChatPrefs,
  type NotifyPrefs,
  type PrivacyPrefs,
} from "@/lib/workspace/prefs";
import type { WorkspaceTenant } from "@/lib/data/workspace";
import { wsCopy, type WsLocale } from "@/lib/workspace/copy";
import { cn } from "@/lib/utils";

type View =
  | "home"
  | "account"
  | "chat"
  | "privacy"
  | "notifications"
  | "data"
  | "devices"
  | "language";

type Profile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
};

export function WsProfileSheet({
  open,
  onClose,
  displayName,
  username,
  email,
  role,
  avatarUrl,
  tenants,
  activeTenantId,
  locale,
  theme,
  onLocale,
  onProfile,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  username: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  tenants: WorkspaceTenant[];
  activeTenantId: string | null;
  locale: WsLocale;
  theme: "dark" | "light";
  onLocale: (locale: WsLocale) => void;
  onProfile: (next: { displayName: string; username: string; avatarUrl: string | null }) => void;
}) {
  const [view, setView] = useState<View>("home");
  const [menu, setMenu] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: "",
    email,
    username,
    displayName,
    role,
    avatarUrl,
    bio: "",
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [chat, setChat] = useState<ChatPrefs>(loadChatPrefs);
  const [notify, setNotify] = useState<NotifyPrefs>(loadNotifyPrefs);
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(loadPrivacyPrefs);
  const fileRef = useRef<HTMLInputElement>(null);
  const t = wsCopy(locale);
  const titles: Record<View, string> = {
    home: t.profile,
    account: t.account,
    chat: t.chatSettings,
    privacy: t.privacy,
    notifications: t.notifications,
    data: t.data,
    devices: t.devices,
    language: t.language,
  };
  const roleLabel = role === "admin" ? t.admin : role === "collaborator" ? t.collaborator : t.member;

  useEffect(() => {
    if (!open) {
      setView("home");
      setMenu(false);
      return;
    }
    setProfile((p) => ({ ...p, email, username, displayName, role, avatarUrl }));
    setChat(loadChatPrefs());
    setNotify(loadNotifyPrefs());
    setPrivacy(loadPrivacyPrefs());
    void fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: Profile } | null) => {
        if (d?.user) setProfile(d.user);
      })
      .catch(() => undefined);
  }, [open, email, username, displayName, role, avatarUrl]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login?next=/ws";
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNote("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName,
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; user?: Profile };
    setBusy(false);
    if (!res.ok) {
      setNote(data.error || t.saveFailed);
      return;
    }
    if (data.user) {
      setProfile(data.user);
      onProfile({ displayName: data.user.displayName, username: data.user.username, avatarUrl: data.user.avatarUrl });
    }
    setNote(t.saved);
  }

  async function onAvatar(file: File) {
    setBusy(true);
    setNote("");
    try {
      const up = await uploadWorkspaceFile(file);
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: up.url }),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: Profile; error?: string };
      if (!res.ok) throw new Error(data.error || "avatar");
      if (data.user) {
        setProfile(data.user);
        onProfile({ displayName: data.user.displayName, username: data.user.username, avatarUrl: data.user.avatarUrl });
      } else {
        setProfile((p) => ({ ...p, avatarUrl: up.url }));
        onProfile({ displayName: profile.displayName, username: profile.username, avatarUrl: up.url });
      }
    } catch {
      setNote(t.photoFailed);
    } finally {
      setBusy(false);
    }
  }

  async function switchTenant(id: string) {
    await fetch("/api/workspace/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ switchTo: id }),
    });
    window.location.reload();
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const confirm = String(new FormData(form).get("confirm") ?? "");
    if (password !== confirm) {
      setNote(t.passwordMismatch);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) {
      setNote(t.passwordFailed);
      return;
    }
    form.reset();
    setNote(t.passwordUpdated);
  }

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            profile,
            tenants,
            prefs: { chat, notify, privacy, locale, theme },
            exportedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "arka-workspace-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearLocal() {
    const keep = ["as_theme", "ws-theme", "ws-locale"];
    const dump: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith("ws-") && !keep.includes(key)) dump.push(key);
    }
    dump.forEach((key) => localStorage.removeItem(key));
    setNote(t.cacheCleared);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-[var(--theme-bg-color)] text-[var(--theme-caption-color)]">
      <div className="mx-auto flex h-full max-w-lg flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3">
          {view === "home" ? (
            <button type="button" className="grid h-10 w-10 place-items-center text-[var(--theme-dark-color)]" onClick={onClose} aria-label={t.close}>
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button type="button" className="grid h-10 w-10 place-items-center text-[var(--theme-dark-color)]" onClick={() => { setView("home"); setNote(""); }} aria-label={t.back}>
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
          )}
          <p className="min-w-0 flex-1 text-[17px] font-medium">{titles[view]}</p>
          {view === "home" ? (
            <div className="relative">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-[var(--theme-comp-header-color)] text-[var(--theme-content-color)]" onClick={() => setMenu((v) => !v)} aria-label={t.more}>
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menu ? (
                <div className="absolute end-0 z-10 mt-2 w-40 overflow-hidden rounded-[12px] bg-[var(--theme-comp-header-color)] py-1 shadow-lg">
                  <button type="button" className="block w-full px-4 py-2.5 text-start text-[14px] text-red-300" onClick={() => void logout()}>
                    {t.logOut}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </header>

        <div className="ws-scroll min-h-0 flex-1 overflow-auto px-4 pb-8">
          {view === "home" ? (
            <>
              <div className="flex flex-col items-center pb-6 pt-2">
                <button type="button" className="relative" onClick={() => fileRef.current?.click()} aria-label={t.changePhoto}>
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-24 w-24 place-items-center rounded-full bg-[var(--theme-navpanel-hovered)] text-2xl font-semibold">
                      {(profile.displayName || "A").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
                <p className="mt-3 text-[20px] font-semibold">{profile.displayName || t.workspace}</p>
                <p className="text-[13px] text-[var(--theme-darker-color)]">{roleLabel}</p>
              </div>
              <Section title={t.accounts}>
                <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-start" onClick={() => setView("account")}>
                  <span className="text-[15px]">{profile.username || t.account}</span>
                  <span className="text-[12px] text-[var(--theme-darker-color)]">{t.youBadge}</span>
                </button>
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    type="button"
                    className="flex w-full items-center justify-between border-t border-[var(--theme-divider-color)] px-4 py-3 text-start"
                    onClick={() => void switchTenant(tenant.id)}
                  >
                    <span className="text-[15px]">{tenant.slug || tenant.name}</span>
                    {tenant.id === activeTenantId ? <span className="text-[12px] text-emerald-300">{t.activeNow}</span> : null}
                  </button>
                ))}
              </Section>
              <Section title={t.settings}>
                <Row label={t.account} onClick={() => setView("account")} />
                <Row label={t.chatSettings} onClick={() => setView("chat")} />
                <Row label={t.privacy} onClick={() => setView("privacy")} />
                <Row label={t.notifications} onClick={() => setView("notifications")} />
                <Row label={t.data} onClick={() => setView("data")} />
                <Row label={t.devices} onClick={() => setView("devices")} />
                <Row label={t.language} onClick={() => setView("language")} last />
              </Section>
            </>
          ) : null}

          {view === "account" ? (
            <form className="space-y-3" onSubmit={(e) => void saveAccount(e)}>
              <Section>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label={t.changePhoto}>
                    {profile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--theme-navpanel-hovered)]">{(profile.displayName || "A").slice(0, 1).toUpperCase()}</span>
                    )}
                  </button>
                  <p className="text-[13px] text-[var(--theme-darker-color)]">{t.photoHint}</p>
                </div>
              </Section>
              <label className="block text-[12px] text-[var(--theme-darker-color)]">
                {t.displayName}
                <input className="ws-input mt-1" value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} maxLength={48} required />
              </label>
              <label className="block text-[12px] text-[var(--theme-darker-color)]">
                {t.username}
                <input className="ws-input mt-1" value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.toLowerCase() }))} maxLength={24} required />
              </label>
              <label className="block text-[12px] text-[var(--theme-darker-color)]">
                {t.email}
                <input className="ws-input mt-1 opacity-60" value={profile.email} readOnly />
              </label>
              <label className="block text-[12px] text-[var(--theme-darker-color)]">
                {t.bio}
                <textarea className="ws-input mt-1 min-h-24" value={profile.bio ?? ""} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} maxLength={400} />
              </label>
              <button type="submit" disabled={busy} className="ws-btn ws-btn-primary w-full">
                {busy ? t.saving : t.saveAccount}
              </button>
            </form>
          ) : null}

          {view === "chat" ? (
            <Section>
              <Toggle label={t.sendEnter} on={chat.enterToSend} onChange={(on) => { const next = { ...chat, enterToSend: on }; setChat(next); saveChatPrefs(next); }} />
              <Toggle label={t.messageSounds} on={chat.sound} onChange={(on) => { const next = { ...chat, sound: on }; setChat(next); saveChatPrefs(next); }} />
              <Toggle label={t.compactMessages} on={chat.compact} onChange={(on) => { const next = { ...chat, compact: on }; setChat(next); saveChatPrefs(next); }} last />
            </Section>
          ) : null}

          {view === "privacy" ? (
            <div className="space-y-3">
              <Section>
                <Toggle label={t.readReceipts} on={privacy.readReceipts} onChange={(on) => { const next = { ...privacy, readReceipts: on }; setPrivacy(next); savePrivacyPrefs(next); }} />
                <Toggle label={t.anyoneDm} on={privacy.anyoneCanDm} onChange={(on) => { const next = { ...privacy, anyoneCanDm: on }; setPrivacy(next); savePrivacyPrefs(next); }} last />
              </Section>
              <p className="px-1 text-[12px] text-[var(--theme-darker-color)]">{t.password}</p>
              <form className="space-y-2" onSubmit={(e) => void savePassword(e)}>
                <input name="password" type="password" required minLength={8} placeholder={t.newPassword} className="ws-input" />
                <input name="confirm" type="password" required minLength={8} placeholder={t.repeatPassword} className="ws-input" />
                <button type="submit" disabled={busy} className="ws-btn ws-btn-primary w-full">
                  {t.updatePassword}
                </button>
              </form>
            </div>
          ) : null}

          {view === "notifications" ? (
            <Section>
              <Toggle label={t.inboxActivity} on={notify.inbox} onChange={(on) => { const next = { ...notify, inbox: on }; setNotify(next); saveNotifyPrefs(next); }} />
              <Toggle label={t.mentionAlerts} on={notify.mentions} onChange={(on) => { const next = { ...notify, mentions: on }; setNotify(next); saveNotifyPrefs(next); }} />
              <Toggle label={t.taskAlerts} on={notify.tasks} onChange={(on) => { const next = { ...notify, tasks: on }; setNotify(next); saveNotifyPrefs(next); }} />
              <Toggle label={t.meetingAlerts} on={notify.meetings} onChange={(on) => { const next = { ...notify, meetings: on }; setNotify(next); saveNotifyPrefs(next); }} last />
            </Section>
          ) : null}

          {view === "data" ? (
            <Section>
              <button type="button" className="block w-full px-4 py-3 text-start text-[15px]" onClick={exportData}>
                {t.downloadData}
              </button>
              <button type="button" className="block w-full border-t border-[var(--theme-divider-color)] px-4 py-3 text-start text-[15px] text-red-300" onClick={clearLocal}>
                {t.clearCache}
              </button>
            </Section>
          ) : null}

          {view === "devices" ? (
            <Section>
              <div className="px-4 py-3">
                <p className="text-[15px]">{t.thisBrowser}</p>
                <p className="mt-1 break-all text-[12px] text-[var(--theme-darker-color)]">{typeof navigator === "undefined" ? "" : navigator.userAgent}</p>
                <p className="mt-2 text-[12px] text-[var(--theme-darker-color)]">{typeof navigator !== "undefined" && navigator.onLine ? t.onlineYes : t.onlineNo}</p>
              </div>
            </Section>
          ) : null}

          {view === "language" ? (
            <Section>
              <Row label={locale === "en" ? "English ✓" : "English"} onClick={() => onLocale("en")} />
              <Row label={locale === "fa" ? "فارسی ✓" : "فارسی"} onClick={() => onLocale("fa")} last />
            </Section>
          ) : null}

          {note ? <p className="mt-3 text-center text-[13px] text-[var(--theme-dark-color)]">{note}</p> : null}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onAvatar(file);
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {title ? <p className="mb-2 px-1 text-[13px] text-[var(--theme-darker-color)]">{title}</p> : null}
      <div className="overflow-hidden rounded-[12px] bg-[var(--theme-comp-header-color)]">{children}</div>
    </div>
  );
}

function Row({ label, onClick, last }: { label: string; onClick: () => void; last?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn("block w-full px-4 py-3.5 text-start text-[15px]", !last && "border-b border-[var(--theme-divider-color)]")}>
      {label}
    </button>
  );
}

function Toggle({ label, on, onChange, last }: { label: string; on: boolean; onChange: (on: boolean) => void; last?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between px-4 py-3.5", !last && "border-b border-[var(--theme-divider-color)]")}>
      <span className="text-[15px]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn("relative h-7 w-12 rounded-full", on ? "bg-emerald-500" : "bg-[var(--theme-navpanel-hovered)]")}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white transition", on ? "end-0.5" : "start-0.5")} />
      </button>
    </div>
  );
}
