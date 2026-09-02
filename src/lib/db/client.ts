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

function createClient(): PrismaClient {
  const log: Array<"error" | "warn"> =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  const accelerate = process.env.PRISMA_ACCELERATE_URL || process.env.DATABASE_URL || "";
  if (isAccelerateUrl(accelerate)) {
    const client = new PrismaClient({
      log,
      datasources: { db: { url: accelerate } },
    }).$extends(withAccelerate());
    return client as unknown as PrismaClient;
  }

  return new PrismaClient({ log });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export type DbClient = PrismaClient;
