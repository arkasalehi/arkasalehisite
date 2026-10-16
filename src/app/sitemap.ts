import { siteConfig } from "@/lib/config";
import { listPublishedSlugs } from "@/lib/data/posts";
import { listProductSlugs } from "@/lib/data/products";
import { postPath } from "@/lib/utils";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

/** Bump when the static routes themselves change. Not the request time. */
const STATIC_LAST_MODIFIED = "2026-09-02T00:00:00.000Z";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/blog", "/video", "/shorts", "/products"].map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: STATIC_LAST_MODIFIED,
  }));

  try {
    const [posts, products] = await Promise.all([listPublishedSlugs(), listProductSlugs()]);
    return [
      ...staticRoutes,
      ...posts.map((post) => ({
        url: `${siteConfig.url}${postPath(post.type, post.slug)}`,
        lastModified: post.updatedAt,
      })),
      ...products.map((product) => ({
        url: `${siteConfig.url}/product/${product.slug}`,
        lastModified: product.updatedAt,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
