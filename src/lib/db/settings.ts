import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { getDb, hasDatabaseUrl } from "./client";
import { cached, invalidateCache } from "@/lib/cache";
import { defaultCms, type SiteCms } from "@/lib/cms/types";

const KEYS: Array<keyof SiteCms> = ["hero", "about", "footer", "seo", "socials", "startHere"];

function merge(base: SiteCms, raw: Partial<SiteCms>): SiteCms {
  return {
    hero: { ...base.hero, ...raw.hero },
    about: { ...base.about, ...raw.about },
    footer: { links: raw.footer?.links?.length ? raw.footer.links : base.footer.links },
    seo: { ...base.seo, ...raw.seo },
    socials: raw.socials?.length ? raw.socials : base.socials,
    startHere: { ...base.startHere, ...raw.startHere },
  };
}

export const getSiteCms = cache(async (): Promise<SiteCms> => {
  return cached("cms:all", 30_000, async () => {
    const defaults = defaultCms();
    if (!hasDatabaseUrl()) return defaults;
    try {
      const db = getDb();
      const rows = await db.siteSetting.findMany();
      const raw: Partial<SiteCms> = {};
      for (const row of rows) {
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
  const db = getDb();
  const entries = Object.entries(patch) as Array<[keyof SiteCms, SiteCms[keyof SiteCms]]>;
  for (const [key, value] of entries) {
    if (!KEYS.includes(key) || value === undefined) continue;
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }
  invalidateCache("cms:");
}
