"use client";
import React, { useEffect, useRef } from "react";

export function RowMenu({ open, isOpen, onClose, children, align = "right", label, placement = "down", className }: { open?: boolean; isOpen?: boolean; onClose: () => void; children: React.ReactNode; align?: "left" | "right"; label?: string; placement?: "down" | "up"; className?: string }) {
  const _open = typeof open === "boolean" ? open : !!isOpen;
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const items = ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const arr = Array.from(items);
        const idx = arr.findIndex((el) => el === document.activeElement);
        let next = 0;
        if (e.key === "ArrowDown") next = idx < 0 ? 0 : (idx + 1) % arr.length;
        if (e.key === "ArrowUp") next = idx < 0 ? arr.length - 1 : (idx - 1 + arr.length) % arr.length;
        arr[next]?.focus();
        e.preventDefault();
      }
    }
    if (_open) document.addEventListener("mousedown", onDoc);
    if (_open) document.addEventListener("keydown", onKey);
    if (_open) {
      setTimeout(() => {
        const first = ref.current?.querySelector<HTMLElement>('[role="menuitem"]');
        first?.focus();
      }, 0);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [_open, onClose]);
  if (!_open) return null;
  const posClass = placement === "up" ? "bottom-full mb-1" : "top-full mt-1";
  const alignClass = align === "right" ? "right-0" : "left-0";
  return (
    <div
      ref={ref}
      className={["absolute z-50 min-w-48 rounded-[var(--ui-radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--ui-shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]", posClass, alignClass, className || ""].join(" ")}
      role="menu"
      aria-label={label}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

export default RowMenu;


