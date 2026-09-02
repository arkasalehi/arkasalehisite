import { json } from "@/lib/http";

export const runtime = "nodejs";

/** SSE is disabled on Workers to avoid long-lived connections blocking deploys. */
export async function GET() {
  return json({ notifications: [], unread: 0, stream: false }, 200);
}
