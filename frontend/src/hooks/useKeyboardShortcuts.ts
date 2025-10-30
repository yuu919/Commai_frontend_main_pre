"use client";

type ShortcutHandlers = {
  onCommandPalette?: () => void;
  onSearch?: () => void;
  onPrimarySubmit?: () => void;
};

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const onKey = (e: KeyboardEvent) => {
    const isMeta = e.ctrlKey || e.metaKey;
    // Cmd/Ctrl+K → Command Palette
    if (isMeta && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      handlers.onCommandPalette?.();
      document.dispatchEvent(new CustomEvent("shortcut:command"));
      return;
    }
    // Cmd/Ctrl+F → Global Search Focus
    if (isMeta && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      if (handlers.onSearch) handlers.onSearch();
      else {
        const el = (document.querySelector('[data-search-input="true"]') || document.getElementById("global-search")) as HTMLElement | null;
        el?.focus();
      }
      document.dispatchEvent(new CustomEvent("shortcut:search"));
      return;
    }
    // Cmd/Ctrl+Enter → Primary action
    if (isMeta && e.key === "Enter") {
      e.preventDefault();
      if (handlers.onPrimarySubmit) handlers.onPrimarySubmit();
      else {
        const primary = document.querySelector('[data-primary-action="true"]') as HTMLButtonElement | null;
        primary?.click();
      }
      document.dispatchEvent(new CustomEvent("shortcut:submit"));
      return;
    }
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

export {};
