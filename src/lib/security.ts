/** Strip tags / angle brackets so comments never render as HTML. Prisma already parameterizes SQL. */
export function sanitizeText(input: string, max = 2000) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

export function assertSameOrigin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) {
    if (fetchSite === "same-origin" || fetchSite === "none") return;
    if (process.env.NODE_ENV === "production") {
      const err = new Error("FORBIDDEN");
      err.name = "FORBIDDEN";
      throw err;
    }
    return;
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }
  if (originHost !== host) {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }
}
