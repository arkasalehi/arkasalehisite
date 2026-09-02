import { getDb } from "./client";
import { getProductsByIds } from "./products";
import type { CartItem as ClientCart } from "@/lib/cart";

export async function getUserCart(userId: string): Promise<ClientCart[]> {
  try {
    const db = getDb();
    const rows = await db.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    return rows.map((row) => ({
      productId: row.productId,
      slug: row.product.slug,
      title: row.product.title,
      price: row.product.price,
      imageUrl: row.product.imageUrl,
      quantity: row.quantity,
    }));
  } catch (error) {
    console.error("getUserCart", error);
    return [];
  }
}

export async function replaceUserCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
  try {
    const db = getDb();
    const products = await getProductsByIds(items.map((i) => i.productId));
    const valid = items.filter((item) => products.some((p) => p.id === item.productId && p.inStock));

    await db.$transaction([
      db.cartItem.deleteMany({ where: { userId } }),
      ...valid.map((item) =>
        db.cartItem.create({
          data: { userId, productId: item.productId, quantity: item.quantity },
        }),
      ),
    ]);

    return getUserCart(userId);
  } catch (error) {
    console.error("replaceUserCart", error);
    return [];
  }
}

export async function listRelatedProducts(slug: string, take = 3) {
  try {
    const db = getDb();
    return await db.product.findMany({
      where: { slug: { not: slug }, inStock: true },
      orderBy: { featured: "desc" },
      take,
    });
  } catch (error) {
    console.error("listRelatedProducts", error);
    return [];
  }
}
