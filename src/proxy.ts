import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminRole } from "@/lib/auth/roles";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  const adminPage = pathname.startsWith("/admin") || pathname.startsWith("/preview");
  const adminApi = pathname.startsWith("/api/admin");

  let authed = false;
  let role: string | null = null;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = Boolean(user);

    if (user && (adminPage || adminApi)) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      role = typeof data?.role === "string" ? data.role : null;
    }
  }

  const needsAuth =
    adminPage ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checkout");

  if (needsAuth && !authed) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (adminPage && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (adminApi && !authed) {
    return jsonError("لطفاً وارد شوید", 401);
  }

  if (adminApi && !isAdminRole(role)) {
    return jsonError("دسترسی مجاز نیست", 403);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
