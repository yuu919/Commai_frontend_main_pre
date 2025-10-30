"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlStateManager(params: { onInit: (sp: URLSearchParams)=>void; getParams: ()=>Record<string,string|undefined>; debounceMs?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // init
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams?.entries?.() ?? []));
    params.onInit(sp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update
  function update() {
    if (!pathname) return;
    const next = new URLSearchParams(Array.from(searchParams?.entries?.() ?? []));
    const obj = params.getParams();
    Object.entries(obj).forEach(([k,v])=> { if (v && String(v).length) next.set(k, String(v)); else next.delete(k); });
    const url = `${pathname}?${next.toString()}`;
    router.replace(url);
  }

  function schedule() {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(update, params.debounceMs ?? 250);
  }

  return { update, schedule };
}


