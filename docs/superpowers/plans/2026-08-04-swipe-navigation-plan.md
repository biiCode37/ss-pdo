# Mobile Touch Swipe & Infinite Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan gestur swipe layar hp (geser kiri & kanan) dengan infinite navigation antar halaman utama (Input Shift vs Dashboard) dan navigasi tanggal pada aplikasi SS_PDO.

**Architecture:** Membuat komponen wrapper `SwipeableContainer.tsx` yang mendeteksi gesture sentuhan (`onTouchStart`, `onTouchMove`, `onTouchEnd`), memfilter gestur scroll vertikal vs swipe horizontal, lalu menghitung navigasi melingkar (*wrap-around*) menggunakan logika modular math.

**Tech Stack:** React, TypeScript, Vitest / React Testing Library, CSS Transitions (`cubic-bezier(0.32, 0.72, 0, 1)`).

## Global Constraints

- Gunakan `pnpm` untuk semua operasi package manager.
- Ikuti standar Mobile-First dan pastikan kompatibilitas Light & Dark mode.
- Jangan mengubah Single Source of Truth (SSOT) Google Sheets / Supabase data layer.
- Selalu jalankan `pnpm run build` dan `pnpm run test` untuk verifikasi.

---

### Task 1: Komponen `SwipeableContainer.tsx` & Unit Test

**Files:**
- Create: `src/components/SwipeableContainer.tsx`
- Create: `src/components/__tests__/SwipeableContainer.test.tsx`

**Interfaces:**
- Consumes: None
- Produces: `SwipeableContainer` component dengan props `onSwipeLeft`, `onSwipeRight`, `minSwipeDistance`, `disabled`.

- [ ] **Step 1: Tulis unit test untuk `SwipeableContainer`**

```tsx
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SwipeableContainer } from '../SwipeableContainer';

describe('SwipeableContainer', () => {
  it('triggers onSwipeLeft when swiped left beyond threshold', () => {
    const handleSwipeLeft = vi.fn();
    const handleSwipeRight = vi.fn();

    const { getByTestId } = render(
      <SwipeableContainer onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        <div data-testid="child">Swipe Area</div>
      </SwipeableContainer>
    );

    const child = getByTestId('child');

    fireEvent.touchStart(child, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(child, { changedTouches: [{ clientX: 100, clientY: 100 }] });

    expect(handleSwipeLeft).toHaveBeenCalledTimes(1);
    expect(handleSwipeRight).not.toHaveBeenCalled();
  });

  it('triggers onSwipeRight when swiped right beyond threshold', () => {
    const handleSwipeLeft = vi.fn();
    const handleSwipeRight = vi.fn();

    const { getByTestId } = render(
      <SwipeableContainer onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        <div data-testid="child">Swipe Area</div>
      </SwipeableContainer>
    );

    const child = getByTestId('child');

    fireEvent.touchStart(child, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(child, { changedTouches: [{ clientX: 200, clientY: 100 }] });

    expect(handleSwipeRight).toHaveBeenCalledTimes(1);
    expect(handleSwipeLeft).not.toHaveBeenCalled();
  });

  it('ignores vertical scrolling', () => {
    const handleSwipeLeft = vi.fn();
    const handleSwipeRight = vi.fn();

    const { getByTestId } = render(
      <SwipeableContainer onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        <div data-testid="child">Swipe Area</div>
      </SwipeableContainer>
    );

    const child = getByTestId('child');

    // Scroll vertical down (deltaY 150 > deltaX 30)
    fireEvent.touchStart(child, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(child, { changedTouches: [{ clientX: 130, clientY: 250 }] });

    expect(handleSwipeLeft).not.toHaveBeenCalled();
    expect(handleSwipeRight).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Jalankan test untuk memverifikasi kegagalan (FAILS)**

Run: `pnpm run test` atau `pnpm dlx vitest run src/components/__tests__/SwipeableContainer.test.tsx`
Expected: FAIL (karena `SwipeableContainer` belum dibuat).

- [ ] **Step 3: Implementasikan `SwipeableContainer.tsx`**

```tsx
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

    // Pengecualian elemen yang sedang diketik atau dislot untuk scroll horizontal internal
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

    // Pastikan pergerakan dominan horizontal (|deltaX| > |deltaY| * 1.2)
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
```

- [ ] **Step 4: Jalankan test untuk memverifikasi keberhasilan (PASS)**

Run: `pnpm dlx vitest run src/components/__tests__/SwipeableContainer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SwipeableContainer.tsx src/components/__tests__/SwipeableContainer.test.tsx
git commit -m "feat: add SwipeableContainer component with touch gesture detection"
```

---

### Task 2: Integrasi Infinite Swipe pada Tab Utama (`Dashboard.tsx`)

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `SwipeableContainer`
- Produces: Gestur swipe kiri/kanan pada seluruh tampilan Dashboard untuk berpindah antara tab `input` dan `analytics` secara melingkar (*infinite swipe*).

- [ ] **Step 1: Hubungkan `SwipeableContainer` di `Dashboard.tsx`**

Bungkus area konten utama `Dashboard.tsx` dengan `SwipeableContainer`:
```tsx
const mainTabs: Array<"input" | "analytics"> = ["input", "analytics"];

const handleSwipeNextTab = () => {
  setMainTab((prev) => {
    const currentIndex = mainTabs.indexOf(prev);
    const nextIndex = (currentIndex + 1) % mainTabs.length;
    return mainTabs[nextIndex];
  });
};

const handleSwipePrevTab = () => {
  setMainTab((prev) => {
    const currentIndex = mainTabs.indexOf(prev);
    const prevIndex = (currentIndex - 1 + mainTabs.length) % mainTabs.length;
    return mainTabs[prevIndex];
  });
};
```

- [ ] **Step 2: Jalankan build & test**

Run: `pnpm run build`
Expected: Success without TypeScript or lint errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: integrate infinite swipe navigation for main tabs in Dashboard"
```

---

### Task 3: Integrasi Swipe Navigasi Tanggal pada `RouteSelectorCard.tsx`

**Files:**
- Modify: `src/components/RouteSelectorCard.tsx`

**Interfaces:**
- Consumes: `setSelectedTab`, `days` array
- Produces: Infinite gesture swipe pada header tanggal untuk berpindah hari (1..31).

- [ ] **Step 1: Tambahkan handler swipe tanggal di `RouteSelectorCard.tsx`**

```tsx
const handleSwipeNextDay = () => {
  if (!days || days.length === 0) return;
  const currentIndex = days.indexOf(selectedTab);
  const nextIndex = (currentIndex + 1) % days.length;
  setSelectedTab(days[nextIndex]);
};

const handleSwipePrevDay = () => {
  if (!days || days.length === 0) return;
  const currentIndex = days.indexOf(selectedTab);
  const prevIndex = (currentIndex - 1 + days.length) % days.length;
  setSelectedTab(days[prevIndex]);
};
```

- [ ] **Step 2: Jalankan build & verifikasi**

Run: `pnpm run build`
Expected: Build sukses.

- [ ] **Step 3: Commit**

```bash
git add src/components/RouteSelectorCard.tsx
git commit -m "feat: add infinite date swipe navigation in RouteSelectorCard"
```

---

### Task 4: Verifikasi & Graphify Update

- [ ] **Step 1: Jalankan pengujian penuh (lint, typecheck, build)**

Run: `pnpm run build`

- [ ] **Step 2: Update Knowledge Graph**

Run: `python "C:\Users\M. Abi Nubly\AppData\Local\uv\tools\graphifyy\Scripts\python.exe" -m graphify update .`

- [ ] **Step 3: Commit akhir & dokumentasi**

```bash
git commit -m "chore: complete mobile swipe and infinite navigation implementation"
```
