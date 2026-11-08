import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, canAccessStaffRoutes, canAccessGmRoutes } from "./lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected route prefixes
  const isStaffRoute = pathname.startsWith("/staff");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isStaffRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Extract session token from cookie
  const sessionToken = request.cookies.get("estate_session")?.value;
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifySessionToken(sessionToken);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check Staff permission
  if (isStaffRoute && !canAccessStaffRoutes(user.role)) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Check GM permission
  if (isAdminRoute && !canAccessGmRoutes(user.role)) {
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  // Attach user headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.userId);
  requestHeaders.set("x-user-role", user.role);
  requestHeaders.set("x-user-email", user.email);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*"],
};
