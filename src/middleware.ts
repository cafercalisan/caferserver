export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sites/:path*",
    "/terminal/:path*",
    "/logs/:path*",
    "/deployments/:path*",
    "/files/:path*",
    "/metrics/:path*",
    "/profile/:path*",
    "/login",
  ],
};
