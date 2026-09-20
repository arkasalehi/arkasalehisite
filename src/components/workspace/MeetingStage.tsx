"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { JitsiRoom } from "@/components/workspace/JitsiRoom";
import { cn } from "@/lib/utils";

type Prefs = {
  audio: boolean;
  mic: boolean;
  video: boolean;
  mirror: boolean;
  preview: boolean;
  hd: boolean;
  pip: boolean;
};

const DEFAULT: Prefs = { audio: true, mic: true, video: true, mirror: true, preview: true, hd: false, pip: true };

export function MeetingStage({
  title,
  subtitle,
  roomName,
  displayName,
}: {
  title: string;
  subtitle: string;
  roomName: string;
  displayName: string;
}) {
  const [settings, setSettings] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [cc, setCc] = useState("Live captions available in the Jitsi room");
  const config = useMemo(() => {
    const flags = [
      `userInfo.displayName="${encodeURIComponent(displayName)}"`,
      "config.prejoinPageEnabled=false",
      "config.disableDeepLinking=true",
      `config.startWithAudioMuted=${prefs.mic ? "false" : "true"}`,
      `config.startWithVideoMuted=${prefs.video ? "false" : "true"}`,
      "interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true",
    ];
    return flags.join("&");
  }, [displayName, prefs.mic, prefs.video]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-[#eef3fb]">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href="/ws/meet" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" aria-label="Back">
          ‹
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          <p className="truncate text-[11px] text-[#8b938d]">{subtitle}</p>
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm" onClick={() => setSettings(true)} aria-label="Settings">
          ⚙
        </button>
      </header>

      <div className="relative min-h-0 flex-1 px-4">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-black shadow-lg">
          <JitsiRoom roomName={roomName} displayName={displayName} hash={config} />
          <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white">Recording</span>
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[10px] text-white">You</span>
          <div className="absolute inset-x-4 bottom-4 rounded-full bg-white/90 px-4 py-2 text-[12px] text-[#3d4741] shadow-sm">
            CC · {cc}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 py-4 pb-[5.5rem] lg:pb-4">
        <Control href="/ws/chat" label="Chat">💬</Control>
        <Control href="/ws/tasks" label="Tasks">☑</Control>
        <button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg shadow-sm" onClick={() => setSettings(true)}>
          ⋯
        </button>
        <Link href="/ws/meet" className="grid h-14 min-w-14 place-items-center rounded-full bg-rose-600 px-3 text-[12px] font-semibold text-white shadow-md" aria-label="Leave">
          Leave
        </Link>
      </div>

      {settings ? (
        <div className="absolute inset-0 z-50 overflow-auto bg-[#f7f8fb] px-4 py-4">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center gap-3">
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white" onClick={() => setSettings(false)}>
                ‹
              </button>
              <h2 className="flex-1 text-center text-[16px] font-semibold">Meeting setting</h2>
              <span className="w-10" />
            </div>
            <Section title="Audio">
              <Toggle label="Auto-connect to audio" hint="" value={prefs.audio} onChange={(v) => setPrefs({ ...prefs, audio: v })} />
              <Toggle label="Mute my microphone" hint="" value={!prefs.mic} onChange={(v) => setPrefs({ ...prefs, mic: !v })} />
              <Toggle label="Use original audio" hint="Enable or disable original sound" value={prefs.audio} onChange={(v) => setPrefs({ ...prefs, audio: v })} />
            </Section>
            <Section title="Video">
              <Toggle label="Turn off my video" value={!prefs.video} onChange={(v) => setPrefs({ ...prefs, video: !v })} />
              <Toggle label="Mirror my video" value={prefs.mirror} onChange={(v) => setPrefs({ ...prefs, mirror: v })} />
              <Toggle label="Show video preview" value={prefs.preview} onChange={(v) => setPrefs({ ...prefs, preview: v })} />
              <Toggle label="HD video" value={prefs.hd} onChange={(v) => setPrefs({ ...prefs, hd: v })} />
              <Toggle label="Picture in picture" value={prefs.pip} onChange={(v) => setPrefs({ ...prefs, pip: v })} />
            </Section>
            <Section title="General">
              <label className="block px-1 py-2 text-[13px] text-[#5b655f]">
                Caption note
                <input value={cc} onChange={(e) => setCc(e.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-white px-3 outline-none ring-1 ring-[#e8ece6]" />
              </label>
            </Section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Control({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg shadow-sm" aria-label={label}>
      {children}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-[13px] font-semibold">{title}</h3>
      <div className="divide-y divide-[#f0f2f5]">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-[13px]">{label}</p>
        {hint ? <p className="text-[11px] text-[#8b938d]">{hint}</p> : null}
      </div>
      <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className={cn("relative h-6 w-11 rounded-full", value ? "bg-[#2f6bff]" : "bg-[#d9dee7]")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm", value ? "left-5" : "left-0.5")} />
      </button>
    </div>
  );
}
