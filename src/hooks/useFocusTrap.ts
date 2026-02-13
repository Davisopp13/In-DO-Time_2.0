"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps focus within a container when active.
 * Also restores focus to the previously focused element on close.
 */
export function useFocusTrap(active: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the element that was focused when the trap was activated
    triggerRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null); // Only visible elements

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  // Restore focus when deactivated
  useEffect(() => {
    if (active) return;

    return () => {
      // Restore focus to trigger element when the effect cleans up (modal closes)
    };
  }, [active]);

  // When active becomes false, restore focus
  const prevActive = useRef(active);
  useEffect(() => {
    if (prevActive.current && !active && triggerRef.current) {
      // Use setTimeout to ensure the modal DOM is removed before restoring focus
      const trigger = triggerRef.current;
      setTimeout(() => {
        if (trigger && typeof trigger.focus === "function") {
          trigger.focus();
        }
      }, 0);
      triggerRef.current = null;
    }
    prevActive.current = active;
  }, [active]);

  return containerRef;
}
