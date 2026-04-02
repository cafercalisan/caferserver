import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/sites",
  "/quests",
  "/terminal",
  "/logs",
  "/deployments",
  "/files",
  "/metrics",
  "/profile",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is protected
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isProtected) {
    // Check for next-auth session token cookie
    const token =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users from /login to /dashboard
  if (pathname === "/login") {
    const token =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");

    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sites/:path*",
    "/quests/:path*",
    "/terminal/:path*",
    "/logs/:path*",
    "/deployments/:path*",
    "/files/:path*",
    "/metrics/:path*",
    "/profile/:path*",
    "/login",
  ],
};
