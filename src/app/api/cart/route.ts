import { requireUser } from "@/lib/auth/session";
import { getUserCart, replaceUserCart } from "@/lib/data/cart";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1).max(20),
    }),
  ),
});

export async function GET() {
  try {
    const session = await requireUser();
    return json({ items: await getUserCart(session.id) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    guardMutation(request, "cart", 30);
    const session = await requireUser();
    const { items } = bodySchema.parse(await request.json());
    return json({ items: await replaceUserCart(session.id, items) });
  } catch (error) {
    return errorResponse(error);
  }
}
