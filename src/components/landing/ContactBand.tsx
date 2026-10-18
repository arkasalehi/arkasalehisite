"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/config";

const email = siteConfig.socials.find((item) => item.href.startsWith("mailto:"))?.href ?? "mailto:hello@arkasalehi.ir";

export function ContactBand() {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          company: form.get("company") ?? "",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "پیام ارسال نشد.");
        return;
      }
      setNotice("پیام رسید. جواب را به همین ایمیل می‌فرستم.");
      e.currentTarget.reset();
    } catch {
      setError("اتصال برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border py-16 md:py-24">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground md:text-[36px]">یک پروژه در ذهن دارید؟</h2>
          <p className="mt-3 max-w-md text-[15px] leading-8 text-muted">
            برای سفارش طراحی، وب یا جلسه منتورشیپ بنویسید. ایمیل مستقیم هم باز است.
          </p>
          <a href={email} className="mt-5 inline-flex text-sm font-medium text-foreground underline-offset-4 hover:underline">
            {email.replace("mailto:", "")}
          </a>
        </div>
        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">نام</span>
              <input name="name" required minLength={2} maxLength={80} className="field" autoComplete="name" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">ایمیل</span>
              <input name="email" type="email" required maxLength={180} className="field" autoComplete="email" />
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block text-muted">پیام</span>
            <textarea name="message" required minLength={10} maxLength={4000} className="field min-h-32" />
          </label>
          <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden defaultValue="" />
          {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p> : null}
          <button type="submit" className="sb-btn sb-btn-primary mt-4 h-10 px-4" disabled={loading}>
            {loading ? "در حال ارسال…" : "ارسال پیام"}
          </button>
        </form>
      </div>
    </section>
  );
}
