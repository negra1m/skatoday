import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = ["/entrar", "/cadastrar", "/esqueci-senha", "/redefinir", "/api/auth"];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (
    PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/")) ||
    path.startsWith("/_next") ||
    path.startsWith("/icons") ||
    path === "/manifest.json" ||
    path === "/favicon.ico" ||
    path === "/sw.js"
  ) {
    return NextResponse.next();
  }
  const token = req.cookies.get("skatoday_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
