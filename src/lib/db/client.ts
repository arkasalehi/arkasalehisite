import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { isAccelerateUrl } from "@/lib/runtime";

/**
 * Isolated Prisma factory — no Cloudflare bindings in app code.
 *
 * Node / self-hosted: DATABASE_URL=postgresql://...
 * Cloudflare Workers: PRISMA_ACCELERATE_URL (or DATABASE_URL)=prisma://... (HTTP)
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.PRISMA_ACCELERATE_URL?.trim());
}

function createClient(): PrismaClient {
  const log: Array<"error" | "warn"> =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  const accelerate = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL || "";
  if (isAccelerateUrl(accelerate)) {
    // schema.prisma uses env("DATABASE_URL"); Prisma validates it at construct time.
    if (!process.env.DATABASE_URL) process.env.DATABASE_URL = accelerate;
    const client = new PrismaClient({
      log,
      datasources: { db: { url: accelerate } },
    }).$extends(withAccelerate());
    return client as unknown as PrismaClient;
  }

  return new PrismaClient({ log });
}

export function getDb(): PrismaClient {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export type DbClient = PrismaClient;
