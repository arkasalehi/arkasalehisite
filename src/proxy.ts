import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ACCESS_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookies";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) return null;
  return new TextEncoder().encode(value);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const key = secret();
  const access = request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(SESSION_COOKIE)?.value;

  let role: string | null = null;
  let authed = false;

  if (key && access) {
    try {
      const { payload } = await jwtVerify(access, key);
      if (payload.sub && (!payload.typ || payload.typ === "access")) {
        authed = true;
        role = typeof payload.role === "string" ? payload.role : null;
      }
    } catch {
      authed = false;
    }
  }

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/preview");

  if (needsAuth && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/preview")) && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
