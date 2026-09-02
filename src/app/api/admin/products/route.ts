import { requireAdmin } from "@/lib/auth/session";
import { listProducts, upsertProduct, deleteProduct } from "@/lib/db/products";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { productInputSchema } from "@/lib/validators";
import { invalidateCache } from "@/lib/cache";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return json({ products: await listProducts() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    guardMutation(request, "admin-products", 40);
    await requireAdmin();
    const input = productInputSchema.parse(await request.json());
    const product = await upsertProduct(input);
    invalidateCache("products:");
    return json({ product }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    guardMutation(request, "admin-products", 40);
    await requireAdmin();
    const body = await request.json();
    const input = productInputSchema.parse(body);
    const product = await upsertProduct({ ...input, id: String(body.id) });
    invalidateCache("products:");
    return json({ product });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    guardMutation(request, "admin-products", 40);
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return json({ error: "id لازم است" }, 400);
    await deleteProduct(id);
    invalidateCache("products:");
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
