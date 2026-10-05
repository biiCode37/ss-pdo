import { useRef } from "react";

interface GestureOptions {
  contentRef: React.RefObject<HTMLDivElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  onDismiss: () => void;
}

export function useAccumulationGesture({
  contentRef,
  overlayRef,
  onDismiss,
}: GestureOptions) {
  const touchStartYRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const currentDragYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      touchStartTimeRef.current = Date.now();
      isDraggingRef.current = true;
      currentDragYRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current || touchStartYRef.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartYRef.current;
    if (diff > 0 && contentRef.current) {
      currentDragYRef.current = diff;
      contentRef.current.style.transition = "none";
      contentRef.current.style.transform = `translateY(${diff}px) scale(${Math.max(0.95, 1 - diff / 2000)})`;
      if (overlayRef.current) {
        overlayRef.current.style.transition = "none";
        const opacity = Math.max(0.2, 0.65 - diff / 500);
        overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const diff = currentDragYRef.current;
    const duration = Date.now() - touchStartTimeRef.current;
    const velocity = duration > 0 ? diff / duration : 0;
    touchStartYRef.current = 0;

    if (diff > 60 || (diff > 25 && velocity > 0.35)) {
      if (contentRef.current) {
        contentRef.current.style.transition =
          "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        contentRef.current.style.transform = "translateY(100%) scale(0.95)";
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition =
          "opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        overlayRef.current.style.opacity = "0";
      }
      onDismiss();
    } else {
      if (contentRef.current) {
        contentRef.current.style.transition =
          "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        contentRef.current.style.transform = "translateY(0px) scale(1)";
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition =
          "background-color 0.22s cubic-bezier(0.32, 0.72, 0, 1)";
        overlayRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.65)";
      }
    }
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
