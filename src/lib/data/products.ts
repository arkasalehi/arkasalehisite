import { cache } from "react";
import { canQueryDatabase } from "./client";
import { cached } from "@/lib/cache";
import { effectivePrice } from "@/lib/utils";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapProduct } from "./map";

export const listProducts = cache(async (opts?: { featured?: boolean; take?: number }) => {
  return cached(`products:${JSON.stringify(opts ?? {})}`, 20_000, async () => {
    if (!canQueryDatabase()) return [];
    try {
      const db = await createServerSupabase();
      let q = db.from("products").select("*").order("created_at", { ascending: false });
      if (opts?.featured) q = q.eq("featured", true);
      if (opts?.take) q = q.limit(opts.take);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
    } catch (error) {
      console.error("listProducts", error);
      return [];
    }
  });
});

export const getProductBySlug = cache(async (slug: string) => {
  if (!canQueryDatabase()) return null;
  try {
    const db = await createServerSupabase();
    const { data, error } = await db.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error("getProductBySlug", error);
    return null;
  }
});

export async function getProductById(id: string) {
  const db = await createServerSupabase();
  const { data, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as Record<string, unknown>) : null;
}

export async function listProductSlugs() {
  if (!canQueryDatabase()) return [];
  try {
    const db = await createServerSupabase();
    const { data, error } = await db.from("products").select("slug, updated_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({ slug: String(row.slug), updatedAt: new Date(String(row.updated_at)) }));
  } catch (error) {
    console.error("listProductSlugs", error);
    return [];
  }
}

export async function getProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  const db = await createServerSupabase();
  const { data, error } = await db.from("products").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

export async function createOrder(input: {
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  note?: string;
}) {
  const db = await createServerSupabase();
  const { data, error } = await db.rpc("place_order", {
    p_items: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    p_note: input.note ?? null,
  });
  if (error) {
    const err = new Error(error.message.includes("NOT_FOUND") ? "موجودی کافی نیست" : error.message);
    err.name = error.message.includes("UNAUTHORIZED") ? "UNAUTHORIZED" : "NOT_FOUND";
    throw err;
  }
  return { id: (data as { id?: string })?.id, total: input.total, items: input.items, userId: input.userId };
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
  const db = await createServerSupabase();
  const emptyToNull = (v?: string | null) => (v ? v : null);
  const stock = data.stock ?? 0;
  const payload = {
    title: data.title,
    slug: data.slug,
    description: emptyToNull(data.description),
    price: data.price,
    compare_price: data.comparePrice ?? null,
    discount_percent: data.discountPercent ?? 0,
    stock,
    image_url: emptyToNull(data.imageUrl),
    in_stock: data.inStock ?? stock > 0,
    sku: emptyToNull(data.sku),
    featured: data.featured ?? false,
  };

  if (data.id) {
    const { data: row, error } = await db.from("products").update(payload).eq("id", data.id).select("*").single();
    if (error) throw error;
    return mapProduct(row as Record<string, unknown>);
  }
  const { data: row, error } = await db.from("products").insert(payload).select("*").single();
  if (error) throw error;
  return mapProduct(row as Record<string, unknown>);
}

export async function deleteProduct(id: string) {
  const db = await createServerSupabase();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function listOrders(take = 50) {
  const db = await createServerSupabase();
  const { data, error } = await db
    .from("orders")
    .select("*, user:profiles(display_name, email), items:order_items(*, product:products(title))")
    .order("created_at", { ascending: false })
    .limit(take);
  if (error) throw error;
  return data ?? [];
}

export { effectivePrice };
