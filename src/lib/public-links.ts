import type { CmsLink } from "@/lib/cms/types";

const RETIRED = /^\/(products|product|cart|checkout|shorts)(\/|$)/;
const RETIRED_LABELS = new Set(["فروشگاه", "شورتس"]);

/** Shop and shorts routes stay redirected, and must not appear in nav or footer. */
export function isRetiredPublicHref(href: string) {
  const trimmed = href.trim();
  const path = trimmed.startsWith("http")
    ? (() => {
        try {
          return new URL(trimmed).pathname;
        } catch {
          return trimmed;
        }
      })()
    : (trimmed.split(/[?#]/)[0] ?? trimmed);
  return RETIRED.test(path);
}

export function publicLinks(links: CmsLink[] | undefined, fallback: CmsLink[]) {
  const source = links?.length ? links : fallback;
  const cleaned = source.filter((item) => !RETIRED_LABELS.has(item.label) && !isRetiredPublicHref(item.href));
  return cleaned.length ? cleaned : fallback;
}
