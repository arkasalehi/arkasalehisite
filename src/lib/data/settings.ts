import { cache } from "react";
import { publicDb } from "./client";
import { hasSupabaseConfig } from "@/lib/supabase";
import { cached, invalidateCache } from "@/lib/cache";
import { resolveHeroWeather } from "@/lib/cms/heroWeather";
import { defaultCms, type SiteCms } from "@/lib/cms/types";
import { createServerSupabase } from "@/lib/supabase/server";

const KEYS: Array<keyof SiteCms> = ["hero", "about", "footer", "seo", "socials", "startHere", "pricing"];

function merge(base: SiteCms, raw: Partial<SiteCms>): SiteCms {
  return {
    hero: {
      ...base.hero,
      ...raw.hero,
      weather: resolveHeroWeather(raw.hero?.weather ?? base.hero.weather),
    },
    about: { ...base.about, ...raw.about },
    footer: { links: raw.footer?.links?.length ? raw.footer.links : base.footer.links },
    seo: { ...base.seo, ...raw.seo },
    socials: raw.socials?.length ? raw.socials : base.socials,
    startHere: { ...base.startHere, ...raw.startHere },
    pricing: {
      ...base.pricing,
      ...raw.pricing,
      packages: raw.pricing?.packages?.length ? raw.pricing.packages.slice(0, 3) : base.pricing.packages,
    },
  };
}

export const getSiteCms = cache(async (): Promise<SiteCms> => {
  return cached("cms:all", 30_000, async () => {
    const defaults = defaultCms();
    if (!hasSupabaseConfig()) return defaults;
    try {
      const db = publicDb();
      const { data, error } = await db.from("site_settings").select("key, value");
      if (error) throw error;
      const raw: Partial<SiteCms> = {};
      for (const row of data ?? []) {
        const key = row.key as keyof SiteCms;
        if (KEYS.includes(key)) (raw as Record<string, unknown>)[key] = row.value;
      }
      return merge(defaults, raw);
    } catch (error) {
      console.error("getSiteCms", error);
      return defaults;
    }
  });
});

export async function saveSiteCms(patch: Partial<SiteCms>) {
  const db = await createServerSupabase();
  const entries = Object.entries(patch) as Array<[keyof SiteCms, SiteCms[keyof SiteCms]]>;
  for (const [key, value] of entries) {
    if (!KEYS.includes(key) || value === undefined) continue;
    const { error } = await db.from("site_settings").upsert({ key, value });
    if (error) throw error;
  }
  invalidateCache("cms:");
}
