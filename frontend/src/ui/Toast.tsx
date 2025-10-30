"use client";
import React, { useEffect, useState, createContext, useCallback, useMemo, useContext } from "react";

export function Toast({ message, variant = "error", duration = 3000 }: { message: string; variant?: "error" | "info" | "success" | "warning"; duration?: number }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), duration);
    return () => clearTimeout(id);
  }, [duration]);
  if (!open) return null;
  const cls = variant === "error"
    ? "bg-[var(--surface-error-soft)] text-[var(--fg-error-strong)] border-[var(--error)]"
    : variant === "success"
    ? "bg-[var(--surface-success-soft)] text-[var(--fg-success-strong)] border-[var(--success)]"
    : variant === "warning"
    ? "bg-[var(--surface-warn-soft)] text-[var(--fg-warn-strong)] border-[var(--warn)]"
    : "bg-[var(--surface-1)] text-[var(--fg)] border-[var(--border)]";
  return (
    <div className={["fixed right-3 bottom-3 z-50 px-3 py-2 rounded border shadow-[var(--ui-shadow-sm)] text-xs", cls].join(" ")}>{message}</div>
  );
}

type ToastItem = { id: string; message: string; variant?: "error" | "info" | "success" | "warning" };
const ToastCtx = createContext<{ push: (t: Omit<ToastItem, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setItems((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4000);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-3 bottom-3 z-50 space-y-2">
        {items.map((it) => (
          <Toast key={it.id} message={it.message} variant={it.variant} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}


