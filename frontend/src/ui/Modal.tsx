"use client";
import React, { useEffect, useRef } from "react";

export function Modal({ isOpen, onClose, children, title }: { isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    // 初期フォーカス
    setTimeout(() => {
      firstFocusableRef.current?.focus();
    }, 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[var(--overlay-scrim)]" onClick={onClose} />
      <div ref={containerRef} className="relative z-10 min-w-80 max-w-lg rounded-[var(--ui-radius-md)] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--ui-shadow-sm)]">
        {title && (
          <div className="px-4 py-3 border-b border-[var(--border)] text-lg font-semibold">
            {title}
          </div>
        )}
        <div className="p-3">
          {/* フォーカス開始のダミー要素 */}
          <button ref={firstFocusableRef} className="sr-only focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;


