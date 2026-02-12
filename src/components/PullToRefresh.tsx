"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Minimum pull distance in px to trigger refresh. Default 80 */
  threshold?: number;
  disabled?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const pullRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      // Only activate when at the top of scroll
      if (containerRef.current && containerRef.current.scrollTop <= 0) {
        touchStartRef.current = e.touches[0].clientY;
      } else {
        touchStartRef.current = 0;
      }
    },
    [disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing || touchStartRef.current === 0) return;
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - touchStartRef.current);
      // Dampen the pull for a natural feel
      const dampened = Math.min(distance * 0.5, 120);
      pullRef.current = dampened;
      setPullDistance(dampened);
    },
    [disabled, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    if (pullRef.current >= threshold) {
      setIsRefreshing(true);
      setPullDistance(40); // Hold at indicator height
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    pullRef.current = 0;
    touchStartRef.current = 0;
  }, [disabled, isRefreshing, onRefresh, threshold]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isReady = pullDistance >= threshold;

  return (
    <div ref={containerRef} className="relative overflow-auto">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <RefreshCw
          size={20}
          className={`text-[var(--accent)] transition-transform duration-200 ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            transform: `rotate(${Math.min(pullDistance * 3, 360)}deg)`,
            opacity: Math.min(pullDistance / threshold, 1),
          }}
        />
        {isReady && !isRefreshing && (
          <span className="ml-2 text-xs text-[var(--text-muted)]">
            Release to refresh
          </span>
        )}
      </div>

      {children}
    </div>
  );
}
