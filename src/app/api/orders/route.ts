import { requireUser } from "@/lib/auth/session";
import { getProductsByIds, createOrder } from "@/lib/data/products";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { checkoutSchema } from "@/lib/validators";
import { effectivePrice } from "@/lib/utils";
import { sanitizeText } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    guardMutation(request, "checkout", 8);
    const session = await requireUser();
    const input = checkoutSchema.parse(await request.json());
    const products = await getProductsByIds(input.items.map((i) => i.productId));
    const items = input.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.inStock || product.stock < item.quantity) {
        throw Object.assign(new Error("موجودی کافی نیست"), { name: "NOT_FOUND" });
      }
      return {
        productId: product.id,
        quantity: item.quantity,
        price: effectivePrice(product),
      };
    });
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = await createOrder({
      userId: session.id,
      items,
      total,
      note: input.note ? sanitizeText(input.note, 400) : undefined,
    });
    return json({ order, message: "سفارش ثبت شد. پرداخت در نسخه بعدی فعال می‌شود." }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
