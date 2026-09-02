import { cache } from "react";
import { getDb } from "./client";
import { cached } from "@/lib/cache";
import { effectivePrice } from "@/lib/utils";

export const listProducts = cache(async (opts?: { featured?: boolean; take?: number }) => {
  return cached(`products:${JSON.stringify(opts ?? {})}`, 20_000, async () => {
    try {
      const db = getDb();
      return await db.product.findMany({
        where: opts?.featured ? { featured: true } : undefined,
        orderBy: { createdAt: "desc" },
        take: opts?.take,
      });
    } catch (error) {
      console.error("listProducts", error);
      return [];
    }
  });
});

export const getProductBySlug = cache(async (slug: string) => {
  try {
    const db = getDb();
    return await db.product.findUnique({ where: { slug } });
  } catch (error) {
    console.error("getProductBySlug", error);
    return null;
  }
});

export async function listProductSlugs() {
  try {
    const db = getDb();
    return await db.product.findMany({ select: { slug: true, updatedAt: true } });
  } catch (error) {
    console.error("listProductSlugs", error);
    return [];
  }
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const db = getDb();
  return db.product.findMany({ where: { id: { in: ids } } });
}

export async function createOrder(input: {
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  note?: string;
}) {
  const db = getDb();
  return db.$transaction(async (tx) => {
    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.inStock || product.stock < item.quantity) {
        throw Object.assign(new Error("موجودی کافی نیست"), { name: "NOT_FOUND" });
      }
      const nextStock = product.stock - item.quantity;
      await tx.product.update({
        where: { id: product.id },
        data: { stock: nextStock, inStock: nextStock > 0 },
      });
    }

    return tx.order.create({
      data: {
        userId: input.userId,
        status: "PENDING",
        total: input.total,
        note: input.note,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: { include: { product: { select: { title: true } } } } },
    });
  });
}

export async function upsertProduct(data: {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  comparePrice?: number | null;
  discountPercent?: number;
  stock?: number;
  imageUrl?: string | null;
  inStock?: boolean;
  sku?: string | null;
  featured?: boolean;
}) {
  const db = getDb();
  const emptyToNull = (v?: string | null) => (v ? v : null);
  const stock = data.stock ?? 0;
  const payload = {
    title: data.title,
    slug: data.slug,
    description: emptyToNull(data.description),
    price: data.price,
    comparePrice: data.comparePrice ?? null,
    discountPercent: data.discountPercent ?? 0,
    stock,
    imageUrl: emptyToNull(data.imageUrl),
    inStock: data.inStock ?? stock > 0,
    sku: emptyToNull(data.sku),
    featured: data.featured ?? false,
  };

  if (data.id) {
    return db.product.update({ where: { id: data.id }, data: payload });
  }
  return db.product.create({ data: payload });
}

export async function deleteProduct(id: string) {
  const db = getDb();
  await db.product.delete({ where: { id } });
}

export async function listOrders(take = 50) {
  const db = getDb();
  return db.order.findMany({
    include: {
      user: { select: { displayName: true, email: true } },
      items: { include: { product: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export { effectivePrice };
