import { getSession } from "@/lib/auth/session";
import { json } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  return json({ user: session }, 200, { "Cache-Control": "private, no-store" });
}
