"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminRole } from "@/lib/auth/roles";
import type { StudioEvent } from "@/lib/data/studio";
import { dateToJalali, jalaliMonthLength, jalaliMonthName, jalaliToDate } from "@/lib/workspace/jalali";
import { useWsChrome } from "@/lib/theme/workspace";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function countdown(iso: string, locale: "fa" | "en") {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return locale === "fa" ? "شروع شده" : "Started";
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function JalaliCalendar({ events, role, embedded = false }: { events: StudioEvent[]; role: string; embedded?: boolean }) {
  const { t, locale } = useWsChrome();
  const router = useRouter();
  const admin = isAdminRole(role);
  const now = dateToJalali(new Date());
  const [jy, setJy] = useState(now.jy);
  const [jm, setJm] = useState(now.jm);
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  void tick;
  const length = jalaliMonthLength(jy, jm);
  const first = jalaliToDate(jy, jm, 1);
  const startWeek = (first.getDay() + 1) % 7;
  const cells = Array.from({ length: startWeek + length }, (_, i) => (i < startWeek ? null : i - startWeek + 1));
  const next = events.filter((event) => new Date(event.startsAt).getTime() > Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !starts) return;
    await fetch("/api/workspace/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), startsAt: new Date(starts).toISOString(), notifyAt: new Date(starts).toISOString() }),
    });
    setTitle("");
    setStarts("");
    router.refresh();
  }

  return (
    <section id="calendar" className={embedded ? "mt-8" : "ws-scroll h-full overflow-auto p-4"}>
      <div className="ws-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={embedded ? "text-[16px] font-semibold" : "ws-title"}>{t.calendar}</h2>
        <div className="flex gap-2">
          <button type="button" className="ws-btn ws-btn-ghost" onClick={() => (jm === 1 ? (setJy(jy - 1), setJm(12)) : setJm(jm - 1))}>
            ‹
          </button>
          <span className="px-2 text-[14px] font-medium">
            {jalaliMonthName(jm, locale)} {jy}
          </span>
          <button type="button" className="ws-btn ws-btn-ghost" onClick={() => (jm === 12 ? (setJy(jy + 1), setJm(1)) : setJm(jm + 1))}>
            ›
          </button>
        </div>
      </div>
      {next ? (
        <p className="mb-4 rounded-xl bg-[var(--input-BackgroundColor)] px-4 py-3 text-[14px]">
          {t.countdown}: {next.title} · {countdown(next.startsAt, locale)}
        </p>
      ) : null}
      <div className="grid grid-cols-7 gap-1 text-center text-[12px]">
        {(locale === "fa" ? ["ش", "ی", "د", "س", "چ", "پ", "ج"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"]).map((d) => (
          <div key={d} className="py-2 text-[var(--theme-darker-color)]">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const current = day ? jalaliToDate(jy, jm, day) : null;
          const has = current
            ? events.some((event) => {
                const d = new Date(event.startsAt);
                return d.getFullYear() === current.getFullYear() && d.getMonth() === current.getMonth() && d.getDate() === current.getDate();
              })
            : false;
          const isToday = day === now.jd && jm === now.jm && jy === now.jy;
          return (
            <div key={i} className={cn("min-h-12 rounded-xl p-1", isToday && "bg-[var(--ws-accent-muted)]", has && "ring-1 ring-[var(--ws-accent)]")}>
              {day ?? ""}
            </div>
          );
        })}
      </div>
      {admin ? (
        <form onSubmit={(e) => void add(e)} className="mt-4 flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="ws-input min-w-0 flex-1" placeholder={t.addEvent} />
          <input value={starts} onChange={(e) => setStarts(e.target.value)} type="datetime-local" className="ws-input" />
          <button type="submit" className="ws-btn ws-btn-primary">
            {t.addEvent}
          </button>
        </form>
      ) : null}
      <ul className="mt-4 divide-y divide-[var(--theme-divider-color)]">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between py-3 text-[14px]">
            <span>
              {event.title}
              <span className="ms-2 text-[12px] text-[var(--theme-darker-color)]">{new Date(event.startsAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US")}</span>
            </span>
            {admin ? (
              <button type="button" className="text-[12px] text-[var(--ws-status-cancelled)]" onClick={() => void fetch(`/api/workspace/events?id=${event.id}`, { method: "DELETE" }).then(() => router.refresh())}>
                {t.clear}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
