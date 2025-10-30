import React, { useCallback, useEffect, useState } from "react";
import Surface from "@ui/Surface";
import EvidencePanel from "@/features/inspector/panels/EvidencePanel";

export default function InspectorDock({ children, collapsed = false, onToggle }: { children?: React.ReactNode; collapsed?: boolean; onToggle?: (v: boolean) => void }) {
  const [width, setWidth] = useState<number>(360);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const minW = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--inspector-min-w").trim() || "240", 10);
      const maxW = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--inspector-max-w").trim() || "880", 10);
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, minW), maxW);
      setWidth(newWidth);
    };
    const onUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  return (
    <section
      className={[
        "relative shrink-0 h-[100vh] flex flex-col overflow-hidden transition-[width,opacity] duration-200",
        collapsed ? "w-0 opacity-0" : `opacity-100`,
      ].join(" ")}
      id="inspector-dock"
      aria-label="Inspector"
      style={{ width: collapsed ? 0 : width }}
    >
      {!collapsed && (
        <>
          <Surface variant="panel" borderSide="l" className="flex-1 overflow-auto">
            {children ?? <EvidencePanel />}
          </Surface>
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent/30"
            onMouseDown={startResize}
            aria-label="resize inspector"
            role="separator"
            aria-orientation="vertical"
          />
        </>
      )}
    </section>
  );
}
