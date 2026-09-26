import { requireUser } from "@/lib/auth/session";
import { canAccessWorkspace } from "@/lib/auth/roles";
import { listInbox } from "@/lib/data/workspace";
import { errorResponse, json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    if (!canAccessWorkspace(session.role)) {
      const error = new Error("FORBIDDEN");
      error.name = "FORBIDDEN";
      throw error;
    }
    const items = await listInbox(session.id);
    return json({ items });
  } catch (error) {
    return errorResponse(error, "en");
  }
}
