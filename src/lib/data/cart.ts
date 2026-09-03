import { canQueryDatabase } from "./client";
import { getProductsByIds } from "./products";
import type { CartItem as ClientCart } from "@/lib/cart";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapProduct } from "./map";

export async function getUserCart(userId: string): Promise<ClientCart[]> {
  try {
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("cart_items")
      .select("product_id, quantity, product:products(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).flatMap((row) => {
      const rec = row as Record<string, unknown>;
      if (!rec.product || typeof rec.product !== "object") return [];
      const product = mapProduct(rec.product as Record<string, unknown>);
      return [
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: Number(rec.quantity ?? 1),
        },
      ];
    });
  } catch (error) {
    console.error("getUserCart", error);
    return [];
  }
}

export async function replaceUserCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
  try {
    const db = await createServerSupabase();
    const products = await getProductsByIds(items.map((i) => i.productId));
    const valid = items.filter((item) => products.some((p) => p.id === item.productId && p.inStock));
    await db.from("cart_items").delete().eq("user_id", userId);
    if (valid.length) {
      const { error } = await db.from("cart_items").insert(
        valid.map((item) => ({ user_id: userId, product_id: item.productId, quantity: item.quantity })),
      );
      if (error) throw error;
    }
    return getUserCart(userId);
  } catch (error) {
    console.error("replaceUserCart", error);
    return [];
  }
}

export async function listRelatedProducts(slug: string, take = 3) {
  try {
    if (!canQueryDatabase()) return [];
    const db = await createServerSupabase();
    const { data, error } = await db
      .from("products")
      .select("*")
      .neq("slug", slug)
      .eq("in_stock", true)
      .order("featured", { ascending: false })
      .limit(take);
    if (error) throw error;
    return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  } catch (error) {
    console.error("listRelatedProducts", error);
    return [];
  }
}
