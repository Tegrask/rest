import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "dev-secret-at-least-32-characters-long");

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/orders/:path*", "/api/tables/:path*", "/kitchen"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Guests must be able to place orders
  if (pathname === "/api/orders" && method === "POST") {
    return NextResponse.next();
  }

  // The login page must be reachable without a session
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}
