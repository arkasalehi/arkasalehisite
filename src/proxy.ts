import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { withAppCookieOptions } from "@/lib/auth/cookies";
import { isWorkspaceHost, publicSiteUrl } from "@/lib/runtime";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";

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
  if (onWorkspaceHost || onWorkspacePath) {
    requestHeaders.set("x-arka-app", "workspace");
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  const adminPage = pathname.startsWith("/admin") || pathname.startsWith("/preview");
  const adminApi = pathname.startsWith("/api/admin");
  const workspaceGate = onWorkspaceHost || pathname.startsWith("/ws") || pathname.startsWith("/api/workspace");

  let authed = false;
  let isAdmin = false;
  let isCollaborator = false;

  if (url && key) {
    const supabase = createServerClient(url, key, {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = Boolean(user);

    if (user && (adminPage || adminApi)) {
      const { data } = await supabase.rpc("is_admin");
      isAdmin = data === true;
    }
    if (user && workspaceGate) {
      const { data } = await supabase.rpc("is_collaborator");
      isCollaborator = data === true;
    }
  }

  const needsAuth =
    adminPage ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checkout") ||
    workspaceGate;

  if (needsAuth && !authed) {
    if (onWorkspaceHost) {
      const login = new URL("/login", publicSiteUrl());
      login.searchParams.set("next", "/ws");
      return NextResponse.redirect(login);
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname.startsWith("/ws") ? "/ws" : pathname);
    return NextResponse.redirect(login);
  }

  if (workspaceGate && !isCollaborator) {
    if (pathname.startsWith("/api/workspace")) {
      return jsonError("Access denied", 403);
    }
    return NextResponse.redirect(new URL("/", publicSiteUrl()));
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

  if (onWorkspaceHost && !pathname.startsWith("/ws") && !pathname.startsWith("/api/") && !pathname.startsWith("/_next")) {
    const rewrite = request.nextUrl.clone();
    rewrite.pathname = pathname === "/" ? "/ws" : `/ws${pathname}`;
    const rewritten = NextResponse.rewrite(rewrite, { request: { headers: requestHeaders } });
    response.cookies.getAll().forEach((cookie) => rewritten.cookies.set(cookie));
    return rewritten;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
