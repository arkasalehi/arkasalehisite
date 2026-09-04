export const samples = {
  hero: "/samples/hero.jpg",
  studio: "/samples/studio.jpg",
  portrait: "/samples/portrait.jpg",
  interior: "/samples/interior.jpg",
  blog: ["/samples/blog-1.jpg", "/samples/blog-2.jpg", "/samples/blog-3.jpg", "/samples/interior.jpg"],
  video: ["/samples/video-1.jpg", "/samples/video-2.jpg", "/samples/studio.jpg"],
  short: [
    "/samples/short-1.jpg",
    "/samples/short-2.jpg",
    "/samples/short-3.jpg",
    "/samples/short-4.jpg",
    "/samples/short-5.jpg",
  ],
  product: ["/samples/tool-1.jpg", "/samples/tool-2.jpg", "/samples/studio.jpg", "/samples/interior.jpg"],
} as const;

export type SampleKind = "hero" | "studio" | "portrait" | "interior" | "blog" | "video" | "short" | "product";

function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickSample(seed: string, pool: readonly string[]) {
  return pool[hash(seed) % pool.length];
}

export function coverSrc(src: string | null | undefined, seed: string, kind: SampleKind = "blog") {
  if (src) return src;
  const value = samples[kind];
  return typeof value === "string" ? value : pickSample(seed || "arkasalehi", value);
}
