import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { isPublicAuthPath, isWorkspaceHost, publicSiteUrl } from "@/lib/runtime";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-arka-path", pathname);
  const onWorkspaceHost = isWorkspaceHost(host);
  const onWorkspacePath = pathname.startsWith("/ws") || pathname.startsWith("/api/workspace");
  if ((onWorkspaceHost && !isPublicAuthPath(pathname)) || onWorkspacePath) {
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
    pathname.startsWith("/checkout") ||
    workspaceGate;

  let authed = false;
  let isAdmin = false;
  let isCollaborator = false;

  if (url && key && (needsAuth || adminApi)) {
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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authed = Boolean(user);

      if (user && (adminPage || adminApi)) {
        const { data } = await supabase.rpc("is_admin");
        isAdmin = data === true;
      }
      if (user && workspaceGate) {
        const { data, error } = await supabase.rpc("is_collaborator");
        isCollaborator = error ? false : data === true;
        if (error) console.error("proxy is_collaborator", error.message);
      }
    } catch (error) {
      console.error("proxy auth", error);
    }
  }

  if (needsAuth && !authed) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    const afterLogin =
      onWorkspaceHost || pathname.startsWith("/ws") ? (pathname.startsWith("/ws") ? pathname : "/ws") : pathname;
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
    const rewrite = request.nextUrl.clone();
    rewrite.pathname = pathname === "/" ? "/ws" : `/ws${pathname}`;
    const rewritten = NextResponse.rewrite(rewrite, { request: { headers: requestHeaders } });
    response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
    return rewritten;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
