import { ZodError } from "zod";
import { rateLimitDurable, clientKey } from "./rate-limit";
import { assertSameOrigin } from "./security";

export const publicGetCache = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
  Vary: "Accept-Encoding",
};

export function json<T>(data: T, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

const errors = {
  fa: {
    invalid: "ورودی نامعتبر است",
    unauthorized: "لطفاً وارد شوید",
    forbidden: "دسترسی مجاز نیست",
    notFound: "یافت نشد",
    rate: "درخواست‌های زیاد. کمی بعد تلاش کنید.",
    unavailable: "سرویس موقتاً در دسترس نیست",
    server: "خطای سرور",
  },
  en: {
    invalid: "Invalid input",
    unauthorized: "Please sign in",
    forbidden: "Access denied",
    notFound: "Not found",
    rate: "Too many requests. Try again shortly.",
    unavailable: "Service temporarily unavailable",
    server: "Server error",
  },
} as const;

export function errorResponse(error: unknown, lang: "fa" | "en" = "fa") {
  const t = errors[lang];
  if (error instanceof ZodError) {
    return json({ error: t.invalid, issues: error.issues }, 400);
  }
  if (error instanceof Error) {
    if (error.name === "UNAUTHORIZED") return json({ error: t.unauthorized }, 401);
    if (error.name === "FORBIDDEN") return json({ error: t.forbidden }, 403);
    if (error.name === "NOT_FOUND") return json({ error: t.notFound }, 404);
    if (error.name === "RATE_LIMIT") return json({ error: t.rate }, 429);
    if (error.message.includes("NEXT_PUBLIC_SUPABASE") || error.message.includes("not set")) {
      return json({ error: t.unavailable }, 503);
    }
  }
  console.error(error);
  return json({ error: t.server }, 500);
}

export async function guardMutation(request: Request, scope: string, limit = 30) {
  assertSameOrigin(request);
  const limited = await rateLimitDurable(clientKey(request, scope), limit);
  if (!limited.ok) {
    const err = new Error("RATE_LIMIT");
    err.name = "RATE_LIMIT";
    throw err;
  }
}
