import React, { useRef } from 'react';

// ponytail: minimal touch gesture container for mobile horizontal swiping
/** Jarak gerak (px) sebelum arah gestur dikunci. */
const AXIS_LOCK_DISTANCE = 10;
/** Gestur horizontal wajib ≥ 2× lebih lebar daripada tingginya (sudut < ~27°). */
const HORIZONTAL_DOMINANCE = 2;
/** Toleransi pergeseran scroll halaman (px) selama gestur sebelum dianggap scroll. */
const PAGE_SCROLL_TOLERANCE = 4;

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
  const startScrollYRef = useRef(0);
  // Arah gestur dikunci sekali di awal gerakan: 'y' (scroll) tidak boleh berubah jadi pindah tab.
  const axisRef = useRef<'x' | 'y' | null>(null);

  const reset = () => {
    startXRef.current = null;
    startYRef.current = null;
    axisRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

    // Multi-touch (pinch/zoom) bukan swipe pindah tab
    if (e.touches.length !== 1) {
      reset();
      return;
    }

    const target = e.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select, .no-swipe, .route-date-tabs, .category-scroll-container, [data-no-swipe="true"]')) {
      reset();
      return;
    }

    // Deteksi programatik untuk elemen yang bisa di-scroll horizontal (BUG-39, BUG-40)
    let current = target;
    while (current && current !== e.currentTarget) {
      if (current.scrollWidth > current.clientWidth && current.clientWidth > 0) {
        const style = window.getComputedStyle(current);
        const overflowX = style.overflowX;
        if (overflowX === 'scroll' || overflowX === 'auto') {
          reset();
          return;
        }
      }
      current = current.parentElement;
    }

    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    startScrollYRef.current = window.scrollY;
    axisRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || axisRef.current !== null || startXRef.current === null || startYRef.current === null) return;
    if (e.touches.length !== 1) {
      reset();
      return;
    }

    const absX = Math.abs(e.touches[0].clientX - startXRef.current);
    const absY = Math.abs(e.touches[0].clientY - startYRef.current);
    if (absX < AXIS_LOCK_DISTANCE && absY < AXIS_LOCK_DISTANCE) return;

    // Horizontal hanya jika jelas dominan sejak awal; selain itu dianggap scroll vertikal.
    axisRef.current = absX > absY * HORIZONTAL_DOMINANCE ? 'x' : 'y';
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || startXRef.current === null || startYRef.current === null) return;

    // Halaman ikut bergulir selama gestur = itu scroll, bukan swipe pindah tab.
    const pageScrolled = Math.abs(window.scrollY - startScrollYRef.current) > PAGE_SCROLL_TOLERANCE;

    if (!pageScrolled && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - startXRef.current;
      const deltaY = e.changedTouches[0].clientY - startYRef.current;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      // Tanpa touchmove tercatat (jarang di perangkat nyata), arah dinilai dari titik akhir.
      const isHorizontalGesture =
        (axisRef.current ?? (absX > absY * HORIZONTAL_DOMINANCE ? 'x' : 'y')) === 'x';

      if (isHorizontalGesture && absX >= minSwipeDistance && absX > absY * HORIZONTAL_DOMINANCE) {
        if (deltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    }

    reset();
  };

  return (
    <div
      className={className}
      style={{ touchAction: 'pan-y', ...style }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={reset}
    >
      {children}
    </div>
  );
};
