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
    <section id="contact" className="ph-section">
      <div className="site-container">
        <div className="ph-contact">
          <div>
            <span className="ph-tag">تماس</span>
            <h2 className="ph-display">یک پروژه در ذهن دارید؟</h2>
            <p className="ph-lede">
              برای سفارش طراحی، وب یا جلسه منتورشیپ بنویسید. ایمیل مستقیم هم باز است.
            </p>
            <a href={email} className="ph-mail">
              {email.replace("mailto:", "")}
            </a>
          </div>
          <form onSubmit={onSubmit} className="ph-form">
            <div className="ph-form-grid">
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
            {error ? <p className="ph-check ph-check-error">{error}</p> : null}
            {notice ? <p className="ph-check ph-check-ok">{notice}</p> : null}
            <button type="submit" className="ph-btn ph-btn-black mt-4 self-start px-5" disabled={loading}>
              {loading ? "در حال ارسال…" : "ارسال پیام"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
