import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const sessionCookie = request.cookies.get("ems-session")?.value;

  if (!isPublic && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Strict Portal Isolation — role-based route protection
  const roleCookie = request.cookies.get("ems-role")?.value;
  const ADMIN_PATHS = ["/employees", "/reports"];
  
  if (roleCookie === "employee" && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    // Redirect employees trying to access admin paths back to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
