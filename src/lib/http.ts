import { ZodError } from "zod";
import { rateLimit, clientKey } from "./rate-limit";
import { assertSameOrigin } from "./security";

export const publicGetCache = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
  Vary: "Accept-Encoding",
};

export function json<T>(data: T, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "ورودی نامعتبر است", issues: error.issues }, 400);
  }
  if (error instanceof Error) {
    if (error.name === "UNAUTHORIZED") return json({ error: "لطفاً وارد شوید" }, 401);
    if (error.name === "FORBIDDEN") return json({ error: "دسترسی مجاز نیست" }, 403);
    if (error.name === "NOT_FOUND") return json({ error: "یافت نشد" }, 404);
    if (error.name === "RATE_LIMIT") return json({ error: "درخواست‌های زیاد. کمی بعد تلاش کنید." }, 429);
    if (error.message.includes("DATABASE_URL") || error.message.includes("JWT_SECRET")) {
      return json({ error: "سرویس موقتاً در دسترس نیست" }, 503);
    }
  }
  console.error(error);
  return json({ error: "خطای سرور" }, 500);
}

export function guardMutation(request: Request, scope: string, limit = 30) {
  assertSameOrigin(request);
  const limited = rateLimit(clientKey(request, scope), limit);
  if (!limited.ok) {
    const err = new Error("RATE_LIMIT");
    err.name = "RATE_LIMIT";
    throw err;
  }
}
