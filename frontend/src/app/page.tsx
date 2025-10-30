import { redirect } from "next/navigation";

export default function Home() {
  // 開発時はバイパスCookieがあればトップをそのまま表示し、なければ既定遷移
  if (typeof document !== "undefined" && document.cookie.includes("auth_disabled=1")) {
    return null;
  }
  redirect("/threads/new");
}
