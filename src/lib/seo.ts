import { siteConfig } from "./config";
import type { PostType } from "@prisma/client";
import { postPath } from "./utils";

type MetaInput = {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
  type?: "website" | "article" | "video.other";
};

export function buildMetadata({ title, description, image, path, type = "website" }: MetaInput) {
  const url = `${siteConfig.url}${path}`;
  const desc = description || siteConfig.description;
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      images: image ? [image] : undefined,
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: post.author.displayName },
    publisher: { "@type": "Person", name: siteConfig.creator },
    mainEntityOfPage: `${siteConfig.url}${postPath(post.type, post.slug)}`,
    inLanguage: "fa-IR",
    timeRequired: post.readingTime ? `PT${post.readingTime}M` : undefined,
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
    description: post.excerpt,
    thumbnailUrl: post.thumbnailUrl || post.coverImage,
    contentUrl: post.videoUrl,
    uploadDate: post.publishedAt?.toISOString(),
    duration,
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
    description: product.description,
    image: product.imageUrl,
    sku: product.slug,
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
