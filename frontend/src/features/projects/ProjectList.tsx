"use client";
import React, { useEffect, useRef, useState } from "react";
import { MutedText, Surface } from "@ui";
import { Virtuoso } from "react-virtuoso";

export default function ProjectList({
  items,
  selectedId,
  onSelect,
  totalCount,
  onEndReached,
  pageSize = 50,
}: {
  items: { id: number; name: string; description?: string | null }[];
  selectedId?: number | null;
  onSelect: (id: number) => void;
  totalCount?: number;
  onEndReached?: () => void;
  pageSize?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<number>(-1);
  const [visible, setVisible] = useState<number>(pageSize);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onScroll() {
      if ((el?.scrollTop ?? 0) + (el?.clientHeight ?? 0) >= (el?.scrollHeight ?? Number.MAX_SAFE_INTEGER) - 24) {
        // client-side pagination
        setVisible((v) => (v < items.length ? Math.min(items.length, v + pageSize) : v));
        onEndReached?.();
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length, onEndReached, pageSize]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 py-1 text-[10px]"><MutedText level={50}>{typeof totalCount === "number" ? `全${totalCount}件` : ""}</MutedText></div>
      <div
        ref={ref}
        className="flex-1 overflow-auto outline-none"
        role="listbox"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            const idx = active >= 0 ? active : 0;
            onSelect(items[idx].id);
          }
        }}
      >
        <div className="p-2">
          <Virtuoso
            style={{ height: "100%" }}
            data={items.slice(0, visible)}
            overscan={200}
            endReached={() => {
              setVisible((v) => (v < items.length ? Math.min(items.length, v + pageSize) : v));
              onEndReached?.();
            }}
            itemContent={(index, p) => (
              <div role="option" aria-selected={selectedId === p.id || active === index} className="mb-2">
                <button
                  className="w-full text-left"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onSelect(p.id)}
                >
                  <Surface
                    bordered
                    radius="sm"
                    interactive={!(selectedId === p.id || active === index)}
                    active={selectedId === p.id || active === index}
                    className="p-3"
                  >
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {p.description && (
                      <div className="text-xs truncate"><MutedText level={40}>{p.description}</MutedText></div>
                    )}
                  </Surface>
                </button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}


