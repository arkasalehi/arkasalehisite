import { requireAdmin } from "@/lib/auth/session";
import { getSiteCms, saveSiteCms } from "@/lib/data/settings";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { siteCmsSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    return json({ cms: await getSiteCms() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    guardMutation(request, "admin-settings", 20);
    await requireAdmin();
    const patch = siteCmsSchema.parse(await request.json());
    await saveSiteCms(patch);
    return json({ ok: true, cms: await getSiteCms() });
  } catch (error) {
    return errorResponse(error);
  }
}
