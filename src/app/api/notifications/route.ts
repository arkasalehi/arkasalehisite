import { requireUser } from "@/lib/auth/session";
import { listNotifications, markNotificationsRead, unreadCount } from "@/lib/db/notifications";
import { errorResponse, guardMutation, json } from "@/lib/http";
import { z } from "zod";

export const runtime = "nodejs";

const markSchema = z.object({
  ids: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    const countOnly = new URL(request.url).searchParams.get("count") === "1";
    const unread = await unreadCount(session.id);
    if (countOnly) return json({ unread });
    const notifications = await listNotifications(session.id);
    return json({ notifications, unread });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    guardMutation(request, "notifications", 40);
    const session = await requireUser();
    const body = markSchema.parse(await request.json().catch(() => ({})));
    await markNotificationsRead(session.id, body.ids);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
