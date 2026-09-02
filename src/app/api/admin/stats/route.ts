import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/db/users";
import { getContentAnalytics } from "@/lib/db/posts";
import { errorResponse, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const [stats, analytics] = await Promise.all([getAdminStats(), getContentAnalytics()]);
    return json({ ...stats, analytics });
  } catch (error) {
    return errorResponse(error);
  }
}
