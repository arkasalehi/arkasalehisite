import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { authCookieKey } from "@/lib/auth/gate-key";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { isPublicAuthPath, isWorkspaceHost, publicSiteUrl } from "@/lib/runtime";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";
import { fetchWithTimeout, hasSupabaseAuthCookie } from "@/lib/supabase/fetch";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type Gate = { authed: boolean; isAdmin: boolean; isCollaborator: boolean; exp: number };

const GATE_TTL_MS = 45_000;
const GATE_MAX = 80;
const gateCache = new Map<string, Gate>();
const gateInflight = new Map<string, Promise<Gate>>();

function pruneGates(now: number) {
  for (const [key, row] of gateCache) {
    if (row.exp <= now) gateCache.delete(key);
  }
  while (gateCache.size >= GATE_MAX) {
    const first = gateCache.keys().next().value;
    if (first === undefined) break;
    gateCache.delete(first);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-arka-path", pathname);
  const onWorkspaceHost = isWorkspaceHost(host);
  const onWorkspacePath = pathname.startsWith("/ws") || pathname.startsWith("/api/workspace");
  if (onWorkspaceHost || onWorkspacePath) {
    requestHeaders.set("x-arka-app", "workspace");
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  const adminPage = pathname.startsWith("/admin") || pathname.startsWith("/preview");
  const adminApi = pathname.startsWith("/api/admin");
  const workspaceGate =
    pathname.startsWith("/ws") ||
    pathname.startsWith("/api/workspace") ||
    (onWorkspaceHost && !isPublicAuthPath(pathname) && !pathname.startsWith("/api/"));
  const needsAuth =
    adminPage ||
    pathname.startsWith("/dashboard") ||
    workspaceGate;

  let authed = false;
  let isAdmin = false;
  let isCollaborator = false;
  const hasCookie = hasSupabaseAuthCookie(request.cookies.getAll());

  if (needsAuth || adminApi) {
    if (!hasCookie) {
      authed = false;
    } else if (url && key) {
      const fp = `${await authCookieKey(request.cookies.getAll())}:${adminPage || adminApi ? "a" : ""}:${workspaceGate ? "c" : ""}`;
      const now = Date.now();
      pruneGates(now);
      const hit = gateCache.get(fp);
      if (hit && hit.exp > now) {
        authed = hit.authed;
        isAdmin = hit.isAdmin;
        isCollaborator = hit.isCollaborator;
      } else {
        const pending = gateInflight.get(fp);
        const load = pending ?? (async () => {
          const supabase = createServerClient(url, key, {
            global: { fetch: fetchWithTimeout(8000) },
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request: { headers: requestHeaders } });
                cookiesToSet.forEach(({ name, value, options }) =>
                  response.cookies.set(name, value, withAppCookieOptions(options, host ?? undefined)),
                );
              },
            },
          });
          const gate: Gate = { authed: false, isAdmin: false, isCollaborator: false, exp: Date.now() + GATE_TTL_MS };
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            gate.authed = Boolean(user);
            if (user && (adminPage || adminApi)) {
              const { data } = await supabase.rpc("is_admin");
              gate.isAdmin = data === true;
            }
            if (user && workspaceGate) {
              const { data, error } = await supabase.rpc("is_collaborator");
              gate.isCollaborator = error ? false : data === true;
              if (error) console.error("proxy is_collaborator", error.message);
            }
          } catch (error) {
            console.error("proxy auth", error);
          }
          gateCache.set(fp, gate);
          gateInflight.delete(fp);
          return gate;
        })();
        if (!pending) gateInflight.set(fp, load);
        const gate = await load;
        authed = gate.authed;
        isAdmin = gate.isAdmin;
        isCollaborator = gate.isCollaborator;
      }
    }
  }

  if (needsAuth && !authed) {
    const login = request.nextUrl.clone();
    const returnTo = `${pathname}${request.nextUrl.search}`;
    login.pathname = "/login";
    login.search = "";
    const afterLogin =
      onWorkspaceHost || pathname.startsWith("/ws")
        ? pathname.startsWith("/ws")
          ? `${pathname}${request.nextUrl.search}`
          : "/ws"
        : returnTo;
    login.searchParams.set("next", afterLogin);
    return NextResponse.redirect(login);
  }

  if (workspaceGate && !isCollaborator) {
    if (pathname.startsWith("/api/workspace")) {
      return jsonError("Access denied", 403);
    }
    return NextResponse.redirect(new URL("/", publicSiteUrl(host)));
  }

  if (adminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (adminApi && !authed) {
    return jsonError("لطفاً وارد شوید", 401);
  }

  if (adminApi && !isAdmin) {
    return jsonError("دسترسی مجاز نیست", 403);
  }

  if (
    onWorkspaceHost &&
    !isPublicAuthPath(pathname) &&
    !pathname.startsWith("/ws") &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next")
  ) {
    const dest = request.nextUrl.clone();
    dest.pathname = pathname === "/" ? "/ws" : `/ws${pathname}`;
    const redirected = NextResponse.redirect(dest);
    response.cookies.getAll().forEach((cookie) => redirected.cookies.set(cookie));
    return redirected;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
