import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-this");
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("clinic_session")?.value;
  const isLogin = pathname === "/login";
  let valid = false;
  if (token) {
    try { await jwtVerify(token, secret); valid = true; } catch { valid = false; }
  }
  if (!valid && !isLogin) return NextResponse.redirect(new URL("/login", request.url));
  if (valid && isLogin) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/health).*)"] };
