import { publicSiteUrl, workspaceUrl } from "@/lib/runtime";

/** Strip tags / angle brackets so comments never render as HTML. Prisma already parameterizes SQL. */
export function sanitizeText(input: string, max = 2000) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(publicSiteUrl()).host.toLowerCase());
  } catch {
    /* ignore */
  }
  try {
    hosts.add(new URL(workspaceUrl()).host.toLowerCase());
  } catch {
    /* ignore */
  }
  return hosts;
}

export function assertSameOrigin(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const host = request.headers.get("host");
  const production = process.env.NODE_ENV === "production";

  if (production && !host) {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }

  if (!origin) {
    if (fetchSite === "same-origin" || fetchSite === "none") return;
    const referer = request.headers.get("referer");
    if (referer && host) {
      try {
        const refererHost = new URL(referer).host.toLowerCase();
        const reqHost = host.split(":")[0]?.toLowerCase() ?? "";
        if (refererHost === host.toLowerCase() || refererHost === reqHost) return;
      } catch {
        /* ignore */
      }
    }
    if (production) {
      const err = new Error("FORBIDDEN");
      err.name = "FORBIDDEN";
      throw err;
    }
    return;
  }

  let originHost = "";
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }

  const allowed = allowedHosts();
  if (host) allowed.add(host.toLowerCase());
  if (!allowed.has(originHost)) {
    const err = new Error("FORBIDDEN");
    err.name = "FORBIDDEN";
    throw err;
  }
}
