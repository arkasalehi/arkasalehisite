import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Prisma must stay external so OpenNext can patch the client for workerd,
  // while Node (`next start`) still uses the native engine.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@prisma/engines/**",
      "node_modules/.prisma/client/libquery_engine*",
      "node_modules/.prisma/client/query_engine*",
      "node_modules/.prisma/client/*.node",
      "node_modules/.prisma/client/*.wasm",
      "node_modules/next/dist/compiled/@vercel/og/**",
    ],
  },
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/icon.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;

// Optional: `CF_DEV=1 npm run dev` wires local Wrangler bindings.
// Default `npm run dev` stays a plain Node Next.js server.
if (process.env.CF_DEV === "1") {
  import("@opennextjs/cloudflare")
    .then((mod) => mod.initOpenNextCloudflareForDev())
    .catch((error) => {
      console.warn("OpenNext Cloudflare dev init skipped:", error);
    });
}
