"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { SiteCms } from "@/lib/cms/types";

function linksToText(links: Array<{ label: string; href: string }>) {
  return links.map((l) => `${l.label}|${l.href}`).join("\n");
}

function parseLinks(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s.trim());
      return { label: label || href, href: href || label };
    });
}

export function SettingsEditor({ initial }: { initial: SiteCms }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const payload: SiteCms = {
      hero: {
        title: String(form.get("heroTitle")),
        subtitle: String(form.get("heroSubtitle")),
        ctaPrimary: String(form.get("ctaPrimary")),
        ctaPrimaryHref: String(form.get("ctaPrimaryHref")),
        ctaSecondary: String(form.get("ctaSecondary")),
        ctaSecondaryHref: String(form.get("ctaSecondaryHref")),
      },
      about: {
        title: String(form.get("aboutTitle")),
        bio: String(form.get("aboutBio")),
        avatarUrl: String(form.get("aboutAvatar")),
      },
      footer: { links: parseLinks(String(form.get("footerLinks") || "")) },
      seo: {
        title: String(form.get("seoTitle")),
        description: String(form.get("seoDescription")),
        ogImage: String(form.get("ogImage")),
      },
      socials: parseLinks(String(form.get("socials") || "")),
      startHere: {
        title: String(form.get("startTitle")),
        description: String(form.get("startDescription")),
        slugs: String(form.get("startSlugs") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "ذخیره نشد");
      return;
    }
    router.refresh();
  }

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <section className="surface space-y-3 p-6">
        <h2 className="text-lg font-medium">هیرو</h2>
        <input name="heroTitle" defaultValue={initial.hero.title} className="field" placeholder="عنوان" />
        <textarea name="heroSubtitle" defaultValue={initial.hero.subtitle} className="field min-h-20" placeholder="زیرعنوان" />
        <div className="grid gap-3 md:grid-cols-2">
          <input name="ctaPrimary" defaultValue={initial.hero.ctaPrimary} className="field" placeholder="CTA اصلی" />
          <input name="ctaPrimaryHref" defaultValue={initial.hero.ctaPrimaryHref} className="field" placeholder="/blog" />
          <input name="ctaSecondary" defaultValue={initial.hero.ctaSecondary} className="field" placeholder="CTA دوم" />
          <input name="ctaSecondaryHref" defaultValue={initial.hero.ctaSecondaryHref} className="field" placeholder="/video" />
        </div>
      </section>

      <section className="surface space-y-3 p-6">
        <h2 className="text-lg font-medium">درباره</h2>
        <input name="aboutTitle" defaultValue={initial.about.title} className="field" />
        <input name="aboutAvatar" defaultValue={initial.about.avatarUrl} className="field" placeholder="URL آواتار" />
        <textarea name="aboutBio" defaultValue={initial.about.bio} className="field min-h-28" />
      </section>

      <section className="surface space-y-3 p-6">
        <h2 className="text-lg font-medium">سئو پیش‌فرض</h2>
        <input name="seoTitle" defaultValue={initial.seo.title} className="field" />
        <textarea name="seoDescription" defaultValue={initial.seo.description} className="field min-h-20" />
        <input name="ogImage" defaultValue={initial.seo.ogImage} className="field" placeholder="OG image URL" />
      </section>

      <section className="surface space-y-3 p-6">
        <h2 className="text-lg font-medium">فوتر و شبکه‌ها</h2>
        <p className="text-xs text-muted">هر خط: برچسب|آدرس</p>
        <textarea name="footerLinks" defaultValue={linksToText(initial.footer.links)} className="field min-h-24" />
        <textarea name="socials" defaultValue={linksToText(initial.socials)} className="field min-h-24" />
      </section>

      <section className="surface space-y-3 p-6">
        <h2 className="text-lg font-medium">از اینجا شروع کنید</h2>
        <input name="startTitle" defaultValue={initial.startHere.title} className="field" />
        <textarea name="startDescription" defaultValue={initial.startHere.description} className="field min-h-16" />
        <input
          name="startSlugs"
          defaultValue={initial.startHere.slugs.join(", ")}
          className="field"
          placeholder="slug-1, slug-2"
        />
      </section>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      <Button type="submit" disabled={saving}>
        {saving ? "در حال ذخیره…" : "ذخیره تنظیمات"}
      </Button>
    </form>
  );
}
