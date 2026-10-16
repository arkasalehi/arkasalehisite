import type { Metadata } from "next";
import { siteConfig } from "./config";
import type { PostType } from "@/lib/types";
import { postPath } from "./utils";
import { resolveDocumentTitle } from "./seo-title";

type MetaInput = {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
  type?: "website" | "article" | "video.other";
};

function plainExcerpt(value?: string | null, max = 180) {
  if (!value) return "";
  const plain = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return `${plain.slice(0, max - 1).trim()}…`;
}

export function absoluteAsset(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${siteConfig.url}${path}`;
}

export function buildMetadata({ title, description, image, path, type = "website" }: MetaInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const desc = plainExcerpt(description, 300) || siteConfig.description;
  const named = resolveDocumentTitle(title, siteConfig.name, path);
  const ogImage = image || siteConfig.ogImage;

  return {
    title: named.title,
    description: desc,
    alternates: { canonical: path || "/" },
    openGraph: {
      title: named.social,
      description: desc,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: named.social,
      description: desc,
      images: [ogImage],
    },
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  coverImage?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  author: { displayName: string };
  type: PostType;
  readingTime?: number | null;
}) {
  const description = plainExcerpt(post.excerpt) || plainExcerpt(post.body) || siteConfig.description;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: absoluteAsset(post.coverImage || siteConfig.ogImage),
    ...(post.publishedAt ? { datePublished: post.publishedAt.toISOString() } : {}),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.displayName.trim() || siteConfig.creator },
    publisher: { "@type": "Person", name: siteConfig.creator },
    mainEntityOfPage: `${siteConfig.url}${postPath(post.type, post.slug)}`,
    inLanguage: "fa-IR",
    ...(post.readingTime ? { timeRequired: `PT${post.readingTime}M` } : {}),
  };
}

export function videoJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  duration?: number | null;
  publishedAt?: Date | null;
  type: PostType;
}) {
  const duration = post.duration
    ? `PT${Math.floor(post.duration / 60)}M${post.duration % 60}S`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.title,
    description: plainExcerpt(post.excerpt) || siteConfig.description,
    thumbnailUrl: absoluteAsset(post.thumbnailUrl || post.coverImage || siteConfig.ogImage),
    ...(post.videoUrl ? { contentUrl: post.videoUrl } : {}),
    ...(post.publishedAt ? { uploadDate: post.publishedAt.toISOString() } : {}),
    ...(duration ? { duration } : {}),
    inLanguage: "fa-IR",
    url: `${siteConfig.url}${postPath(post.type, post.slug)}`,
  };
}

export function productJsonLd(product: {
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  inStock: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: plainExcerpt(product.description) || `${product.title} در ${siteConfig.name}`,
    image: absoluteAsset(product.imageUrl || siteConfig.ogImage),
    sku: product.slug,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/product/${product.slug}`,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.path === "/" ? siteConfig.url : `${siteConfig.url}${item.path}`,
    })),
  };
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.creator,
    url: siteConfig.url,
    image: absoluteAsset(siteConfig.ogImage),
    jobTitle: "طراح و سازنده",
    description: siteConfig.bio,
  };
}

export function professionalServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    url: siteConfig.url,
    image: absoluteAsset(siteConfig.ogImage),
    description: siteConfig.description,
    founder: { "@type": "Person", name: siteConfig.creator },
    areaServed: "IR",
    inLanguage: "fa-IR",
  };
}
