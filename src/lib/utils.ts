import type { PostType } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function postPath(type: PostType, slug: string) {
  if (type === "VIDEO") return `/video/${slug}`;
  if (type === "SHORT") return `/shorts/${slug}`;
  return `/blog/${slug}`;
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatToman(amount: number) {
  return `${new Intl.NumberFormat("fa-IR").format(amount)} تومان`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function readingTimeFromBody(body?: string | null) {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

export function excerpt(text: string, max = 140) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

export function typeLabel(type: PostType) {
  if (type === "VIDEO") return "ویدیو";
  if (type === "SHORT") return "شورتس";
  return "مقاله";
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${new Intl.NumberFormat("fa-IR").format(m)}:${String(s).padStart(2, "0")}`;
}

export function effectivePrice(product: { price: number; discountPercent?: number | null }) {
  const discount = Math.min(90, Math.max(0, product.discountPercent ?? 0));
  if (discount <= 0) return product.price;
  return Math.max(0, Math.round(product.price * (1 - discount / 100)));
}

export function isProductAvailable(product: { inStock: boolean; stock?: number | null }) {
  if (!product.inStock) return false;
  if (product.stock == null) return true;
  return product.stock > 0;
}
