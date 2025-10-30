"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VirtuosoHandle } from "react-virtuoso";

export default function useMessageScroll(itemCount: number) {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadSinceAway, setUnreadSinceAway] = useState(false);
  const prevCountRef = useRef<number>(itemCount);

  const onAtBottomChange = useCallback((v: boolean) => {
    setAtBottom(v);
    if (v) setUnreadSinceAway(false);
  }, []);

  useEffect(() => {
    const prev = prevCountRef.current;
    if (itemCount > prev && !atBottom) {
      setUnreadSinceAway(true);
    }
    prevCountRef.current = itemCount;
  }, [itemCount, atBottom]);

  const scrollToBottom = useCallback(() => {
    if (itemCount <= 0) return;
    virtuosoRef.current?.scrollToIndex({ index: itemCount - 1, align: "end" });
  }, [itemCount]);

  return {
    virtuosoRef,
    atBottom,
    unreadSinceAway,
    showJumpButton: !atBottom && unreadSinceAway,
    onAtBottomChange,
    scrollToBottom,
  } as const;
}


