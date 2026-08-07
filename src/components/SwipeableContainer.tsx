import React, { useRef } from 'react';

// ponytail: minimal touch gesture container for mobile horizontal swiping
export interface SwipeableContainerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SwipeableContainer: React.FC<SwipeableContainerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  minSwipeDistance = 50,
  disabled = false,
  className,
  style,
}) => {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

    const target = e.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select, .no-swipe, .route-date-tabs, .category-scroll-container, [data-no-swipe="true"]')) {
      startXRef.current = null;
      startYRef.current = null;
      return;
    }

    // Deteksi programatik untuk elemen yang bisa di-scroll horizontal (BUG-39, BUG-40)
    let current = target;
    while (current && current !== e.currentTarget) {
      if (current.scrollWidth > current.clientWidth && current.clientWidth > 0) {
        const style = window.getComputedStyle(current);
        const overflowX = style.overflowX;
        if (overflowX === 'scroll' || overflowX === 'auto') {
          startXRef.current = null;
          startYRef.current = null;
          return;
        }
      }
      current = current.parentElement;
    }

    if (e.touches.length > 0) {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || startXRef.current === null || startYRef.current === null) return;

    if (e.changedTouches.length > 0) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startXRef.current;
      const deltaY = endY - startYRef.current;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX >= minSwipeDistance && absX > absY * 1.2) {
        if (deltaX < 0) {
          onSwipeLeft?.();
        } else if (deltaX > 0) {
          onSwipeRight?.();
        }
      }
    }

    startXRef.current = null;
    startYRef.current = null;
  };

  return (
    <div
      className={className}
      style={{ touchAction: 'pan-y', ...style }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};
