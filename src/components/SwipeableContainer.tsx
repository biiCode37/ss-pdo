import React, { useRef } from 'react';

export interface SwipeableContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function SwipeableContainer({
  children,
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  disabled = false,
  className = '',
  style = {},
}: SwipeableContainerProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length === 0) return;

    // Pengecualian elemen input, textarea, select, .no-swipe, .route-date-tabs
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('.no-swipe') ||
        target.closest('.route-date-tabs'))
    ) {
      return;
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || touchStartX.current === null || touchStartY.current === null || e.changedTouches.length === 0) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Reset touch coordinates
    touchStartX.current = null;
    touchStartY.current = null;

    // Dominan horizontal (|deltaX| > |deltaY| * 1.2) dan melebihi minSwipeDistance
    if (absX >= minSwipeDistance && absX > absY * 1.2) {
      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  };

  return (
    <div
      className={`swipeable-container ${className}`}
      style={{ touchAction: 'pan-y', ...style }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}
