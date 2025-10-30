import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token, maxAgeSeconds } = await req.json();
    if (!access_token) {
      return NextResponse.json({ success: false, message: "missing access_token" }, { status: 400 });
    }

    const res = NextResponse.json({ success: true });
    const maxAge = typeof maxAgeSeconds === "number" ? maxAgeSeconds : 60 * 60 * 8; // 8h
    res.cookies.set("auth_token", access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge,
    });
    if (refresh_token) {
      res.cookies.set("refresh_token", refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 14, // 14d
      });
    }
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, message: "invalid payload" }, { status: 400 });
  }
}


