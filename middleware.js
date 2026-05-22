import { NextResponse } from "next/server";
import { isViewAllowed } from "./lib/view-license.js";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/blocked"
  ) {
    return NextResponse.next();
  }

  if (!(await isViewAllowed(process.env.VIEW))) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/blocked";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/api/:path*", "/blocked"],
};
