import { clearSessionCookie } from "@/lib/auth/session";
import { guardMutation, json, errorResponse } from "@/lib/http";

export async function POST(request: Request) {
  try {
    guardMutation(request, "logout", 20);
    await clearSessionCookie();
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
