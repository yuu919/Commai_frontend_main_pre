import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("auth_token", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  res.cookies.set("refresh_token", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  return res;
}


