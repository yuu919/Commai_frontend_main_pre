import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SSR認証ガード: 認証クッキー(auth_token)が無ければ /login へ
export function middleware(req: NextRequest) {
  // 開発用バイパス: .env.local か Cookie、またはクエリで切り替え
  if (process.env.NODE_ENV !== "production") {
    const url = req.nextUrl.clone();
    // 明示的なON/OFF用のテスターエンドポイント
    if (url.pathname === "/__auth/off") {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set("auth_disabled", "1", { path: "/" });
      res.headers.set("x-auth-debug", "auth_disabled=1 via /__auth/off");
      console.log("[middleware] __auth/off → set cookie auth_disabled=1");
      return res;
    }
    if (url.pathname === "/__auth/on") {
      const res = NextResponse.redirect(new URL("/", req.url));
      res.cookies.set("auth_disabled", "", { path: "/", maxAge: 0 });
      res.headers.set("x-auth-debug", "auth_disabled cleared via /__auth/on");
      console.log("[middleware] __auth/on → clear cookie auth_disabled");
      return res;
    }
    if (url.searchParams.get("auth") === "off") {
      url.searchParams.delete("auth");
      const res = NextResponse.redirect(url);
      res.cookies.set("auth_disabled", "1", { path: "/" });
      res.headers.set("x-auth-debug", "auth_disabled=1 via ?auth=off");
      console.log("[middleware] query auth=off → set cookie auth_disabled=1");
      return res;
    }
    const disabledByEnv = process.env.NEXT_PUBLIC_AUTH_DISABLED === "1";
    const disabledByCookie = req.cookies.get("auth_disabled")?.value === "1";
    if (disabledByEnv || disabledByCookie) {
      const res = NextResponse.next();
      res.headers.set(
        "x-auth-debug",
        `bypass=1 env=${disabledByEnv ? "1" : "0"} cookie=${disabledByCookie ? "1" : "0"}`
      );
      console.log("[middleware] bypass auth: env=%s cookie=%s path=%s", disabledByEnv, disabledByCookie, req.nextUrl.pathname);
      return res;
    }
  }
  const { pathname } = req.nextUrl;

  // 許可パス（認証不要）
  const allowPrefixes = [
    "/login",
    "/register",
    "/verify-email",
    "/oauth/callback",
    "/callback",
    "/share/",
    "/_next/",
    "/favicon",
    "/robots.txt",
    "/sitemap.xml",
    "/api/health"
  ];
  if (allowPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 静的資産などは通す
  if (pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$/)) {
    const res = NextResponse.next();
    res.headers.set("x-auth-debug", "static-asset-pass");
    return res;
  }

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.headers.set("x-auth-debug", "redirect-login: no auth_token");
    console.log("[middleware] redirect to /login (no auth_token) path=%s", req.nextUrl.pathname);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-auth-debug", "authorized");
  return res;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};


