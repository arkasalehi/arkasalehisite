import { siteConfig } from "@/lib/config";
import { listPublishedSlugs } from "@/lib/data/posts";
import { postPath } from "@/lib/utils";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

/** Bump when the static routes themselves change. Not the request time. */
const STATIC_LAST_MODIFIED = "2026-09-02T00:00:00.000Z";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/blog", "/video"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: STATIC_LAST_MODIFIED,
  }));

  try {
    const posts = await listPublishedSlugs();
    return [
      ...staticRoutes,
      ...posts
        .filter((post) => post.type !== "SHORT")
        .map((post) => ({
          url: `${siteConfig.url}${postPath(post.type, post.slug)}`,
          lastModified: post.updatedAt,
        })),
    ];
  } catch {
    return staticRoutes;
  }
}
