# Design Spec: Mobile Touch Swipe & Infinite Navigation

**Date:** 2026-08-04  
**Status:** Approved  

---

## 1. Overview & Goal

Aplikasi SS_PDO diprioritaskan untuk pengguna operasional di lapangan (*Mobile-First*). Spesifikasi ini mendefinisikan dukungan gestur sentuh (touch gesture) di layar perangkat seluler untuk mengusap (swipe) ke kiri atau ke kanan guna berpindah antar halaman secara mulus dengan kemampuan **Infinite Swipe** (navigasi melingkar tanpa batas).

---

## 2. Arsitektur & Komponen

### `src/components/SwipeableContainer.tsx`
Komponen wrapper serbaguna yang mengisolasi event sentuhan (`onTouchStart`, `onTouchMove`, `onTouchEnd`) dan menghitung vektor gerakan.

#### Props Interface
```typescript
interface SwipeableContainerProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minSwipeDistance?: number; // default: 50px
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
```

---

## 3. Logika Deteksi Gestur & Infinite Navigation

### A. Algoritma Pembeda Horizontal vs Vertikal
1. Pada `onTouchStart`: Catat posisi `startX` dan `startY`.
2. Pada `onTouchEnd`: Catat posisi `endX` dan `endY`.
3. Hitung `deltaX = endX - startX` dan `deltaY = endY - startY`.
4. Syarat pemicu swipe horizontal valid:
   - `|deltaX| >= minSwipeDistance` (50px)
   - `|deltaX| > |deltaY| * 1.2` (Mencegah pemicu sengaja saat scrolling daftar bus vertikal).

### B. Rumus Infinite Swipe (Modular Wrap-Around)
- **Tab Utama (`mainTab`):** `['input', 'analytics']`
  - `Swipe Left`: indeks selanjutnya = `(currentIndex + 1) % 2`
  - `Swipe Right`: indeks sebelumnya = `(currentIndex - 1 + 2) % 2`
- **Tab Tanggal (`selectedTab`):** `[1, 2, ..., 31]`
  - `Swipe Left`: tanggal selanjutnya = `(currentDay % totalDays) + 1`
  - `Swipe Right`: tanggal sebelumnya = `currentDay === 1 ? totalDays : currentDay - 1`

---

## 4. Keamanan Edge Case & Interaktivitas

- **Exclusion Selectors:** Gesture swipe dibatalkan jika target sentuhan berasal dari elemen form (`input`, `textarea`, `select`, `button`) atau kontainer horizontal internal seperti tab tanggal (`.route-date-tabs`).
- **Touch-Action CSS:** Mengatur `touch-action: pan-y` pada kontainer agar scroll vertikal browser bawaan tetap berjalan dengan lancar tanpa hambatan (*jank-free*).

---

## 5. Standar UI/UX & Animasi

- Menggunakan kurva transisi fisik pegas Apple iOS: `cubic-bezier(0.32, 0.72, 0, 1)`.
- Mengikuti skema warna Light & Dark mode yang diatur via CSS variables.
