# UI/UX Enter-to-Save & Auto-Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur "Enter" untuk menyimpan data dan auto-focus ke input field sesuai kategori aktif saat Bus Card dibuka, guna mempercepat alur kerja user.

**Architecture:** 
- Menggunakan `useRef` di React untuk mendapatkan referensi ke setiap elemen input.
- Menggunakan `useEffect` untuk memantau perubahan *state* `isExpanded`. Jika `isExpanded` menjadi `true` dan `activeCategory` bukan 'ALL', kita akan memberikan fokus ke input yang relevan setelah *delay* 300ms (menunggu animasi selesai).
- Menambahkan *event handler* `onKeyDown` pada setiap input untuk mendeteksi tombol `Enter`. Saat ditekan, *keyboard/numpad* akan di-dismiss (menggunakan `blur()`) dan fungsi `handleSave` akan dipanggil. Waktu *delay* penutupan kartu saat *save success* diubah menjadi instan (0ms) agar lebih cepat.

**Tech Stack:** React (TypeScript)

## Global Constraints

- Pengerjaan dilakukan pada file `src/components/BusCard.tsx`.
- Pastikan tidak ada *breaking changes* pada logika penyimpanan data yang sudah ada.

---

### Task 1: Update BusCard.tsx (Auto-Focus & Enter-to-Save)

**Files:**
- Modify: `src/components/BusCard.tsx`

**Interfaces:**
- Consumes: `activeCategory`, `isExpanded`
- Produces: UI behavior changes.

- [ ] **Step 1: Tambahkan Refs dan KeyDown handler**

Di dalam komponen `BusCard`, tambahkan `useRef` untuk setiap input dan fungsi `handleKeyDown`.

```tsx
import { useState, useEffect, useRef } from 'react';
// ... imports lainnya

export function BusCard({ bus, sheetId, tabName, headerMap, isQueued, addToQueue, activeCategory, onUpdateBus }: Props) {
  // ... state yang sudah ada
  const inputRefs = {
    toaShift1: useRef<HTMLInputElement>(null),
    totalToa: useRef<HTMLInputElement>(null),
    manualShift1: useRef<HTMLInputElement>(null),
    manualShift2: useRef<HTMLInputElement>(null),
    kmAwal1: useRef<HTMLInputElement>(null),
    kmAkhir1: useRef<HTMLInputElement>(null),
    kmAwal2: useRef<HTMLInputElement>(null),
    kmAkhir2: useRef<HTMLInputElement>(null),
    keterangan: useRef<HTMLInputElement>(null),
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
      handleSave(false);
    }
  };
```

- [ ] **Step 2: Tambahkan Auto-Focus useEffect**

Tambahkan `useEffect` yang memantau `isExpanded` dan `activeCategory`.

```tsx
  useEffect(() => {
    if (isExpanded && activeCategory !== 'ALL') {
      const timer = setTimeout(() => {
        const ref = inputRefs[activeCategory as keyof typeof inputRefs];
        if (ref && ref.current && !ref.current.disabled) {
          ref.current.focus();
        }
      }, 300); // Tunggu animasi expand selesai
      return () => clearTimeout(timer);
    }
  }, [isExpanded, activeCategory]);
```

- [ ] **Step 3: Update logika handleSave**

Cari baris ini di dalam fungsi `handleSave`:
```tsx
      setTimeout(() => setIsExpanded(false), 1000); // Auto close on success after 1s
```
Dan ubah menjadi instan:
```tsx
      setIsExpanded(false); // Auto close immediately on success
```

- [ ] **Step 4: Sambungkan refs dan onKeyDown ke input elements**

Untuk setiap elemen `<input>` dalam `BusCard.tsx`, tambahkan prop `ref` yang sesuai dan `onKeyDown={handleKeyDown}`. Contoh untuk TOA SHIFT 1:

```tsx
            <div className="input-group">
              <label>TOA SHIFT 1</label>
              <input 
                ref={inputRefs.toaShift1}
                type="number" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                className="input-field" 
                value={formData.toaShift1 || ''} 
                onChange={handleChange('toaShift1')}
                onKeyDown={handleKeyDown}
                placeholder="0"
                disabled={isFieldDisabled('toaShift1')}
              />
            </div>
```
(Lakukan untuk semua field: `totalToa`, `manualShift1`, `manualShift2`, `kmAwal1`, `kmAkhir1`, `kmAwal2`, `kmAkhir2`, `keterangan`).

- [ ] **Step 5: Verifikasi via Test/Build**

```bash
pnpm run build
```
Pastikan build berhasil dan tidak ada error TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/components/BusCard.tsx docs/superpowers/plans/2026-07-21-ui-ux-enter-to-save.md
git commit -m "docs: add plan for UI/UX enter-to-save and auto-focus"
```
