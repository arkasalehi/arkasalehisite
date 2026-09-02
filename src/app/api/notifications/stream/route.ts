import { requireUser } from "@/lib/auth/session";
import { listNotifications, unreadCount } from "@/lib/db/notifications";
import { isCloudflareRuntime } from "@/lib/runtime";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    const encoder = new TextEncoder();
    const maxMs = isCloudflareRuntime() ? 45_000 : 1000 * 60 * 4;

    const stream = new ReadableStream({
      async start(controller) {
        const send = async () => {
          const [notifications, unread] = await Promise.all([
            listNotifications(session.id, 12),
            unreadCount(session.id),
          ]);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ notifications, unread })}\n\n`),
          );
        };

        await send();
        const timer = setInterval(() => {
          send().catch(() => {
            clearInterval(timer);
            controller.close();
          });
        }, 8000);

        const abort = () => {
          clearInterval(timer);
          controller.close();
        };
        setTimeout(abort, maxMs);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
}
