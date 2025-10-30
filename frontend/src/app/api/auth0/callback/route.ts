import { NextRequest, NextResponse } from "next/server";

// NOTE: 実運用ではAuth0 SDK/PKCEを使う。ここでは雛形のみ用意。
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const access_token = url.searchParams.get("access_token");
  const refresh_token = url.searchParams.get("refresh_token");
  if (!access_token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("auth_token", access_token, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 8 });
  if (refresh_token) {
    res.cookies.set("refresh_token", refresh_token, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 14 });
  }
  return res;
}


