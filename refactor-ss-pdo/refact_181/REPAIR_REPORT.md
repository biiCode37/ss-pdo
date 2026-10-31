# REPAIR REPORT — Refactor 181: Eliminasi Badge Redundan dan Misleading [S1 • S2] pada Daftar Unit Kendala Armada

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`, `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`.

---

## 1. Ringkasan Perbaikan

Sesi ini menyelesaikan keluhan pengalaman pengguna (*UX defect*) terkait kemunculan badge `[S1 • S2]` pada seluruh kartu unit armada kendala di Bottom Sheet rute dan tab Status Armada. Badge tersebut terbukti tidak relevan karena bersumber dari distribusi seragam baris spreadsheet harian, serta menimbulkan kesalahpahaman bagi pengguna yang mengira keterangan kendala tersebut berlaku secara resmi pada dua shift (seharian penuh). Perbaikan dilakukan dengan mengeliminasi elemen badge shift tersebut, menyisakan badge status murni (`[OFF]`, `[BA.02]`, `[TEKNIS]`, `[T.O]`) yang tegas di sisi kanan, serta memberikan ruang horizontal maksimal bagi teks rincian kendala armada.

---

## 2. Detail Implementasi & Before vs After

### Perbaikan 1: Penghapusan Badge `[S1 • S2]` dari Kartu Unit Modal Rute (BUG-181-01)
* **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:780–807`
* **Before:**
  ```tsx
  {/* Status Badge & Shifts */}
  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
    <span style={{ ... }}>
      {u.statusCode}
    </span>
    <span style={{ fontSize: "10px", ... }}>
      {u.shifts.map((s) => `S${s}`).join(" • ")}
    </span>
  </div>
  ```
  Setiap kartu unit merender `[S1 • S2]` di samping badge status. Teks keterangan kendala di sebelah kiri (misal: `BA.02 Kendala Mesin (temperatur Radiator)`) terdesak dan terpotong menjadi `temp...` dengan elipsis.
* **After:**
  ```tsx
  {/* Status Badge */}
  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
    <span style={{ ... }}>
      {u.statusCode}
    </span>
  </div>
  ```
  Elemen badge shift dihapus seutuhnya. Sisi kanan kartu hanya menampilkan badge status operasional (`[OFF]`, `[BA.02]`, dll.) dengan border penegas.
* **Case: Skenario Lapangan:**
  Pengawas rute membuka rute `JAK.115` pada layar ponsel. Pada unit `KWK 222180`, catatan kendala *"BA.02 Kendala Mesin (temperatur Radiator)"* kini terbaca secara lengkap tanpa terpotong. Pengawas tidak lagi bingung apakah unit tersebut mogok di Shift 1 atau seharian, karena tidak ada lagi label `[S1 • S2]` yang misleading.

---

### Perbaikan 2: Penyelarasan Kartu Unit pada Tab Status Armada
* **Lokasi:** `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx:1255–1280`
* **Before:**
  Daftar armada kendala per rute pada tab Status Armada juga merender badge shift `[S1 • S2]` di setiap baris.
* **After:**
  Badge shift dihilangkan secara seragam, menjaga konsistensi visual 100% dengan modal rute. Filter shift yang diinginkan pengguna tetap terkelola dengan bersih melalui filter segmented tab di bagian atas halaman (`[Semua Shift] [Shift 1] [Shift 2]`).

---

## 3. Daftar File yang Diubah & Ditambah

### File Ditambah:
1. `refactor-ss-pdo/refact_181/AUDIT_BUGS.md` — Dokumentasi temuan masalah dan analisis akar penyebab.
2. `refactor-ss-pdo/refact_181/REPAIR_REPORT.md` — Laporan komprehensif Before vs After dan skenario operasional lapangan.

### File Dimodifikasi:
1. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` — Menghapus badge shift `[S1 • S2]` dari kontainer kartu armada kendala.
2. `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` — Menghapus badge shift `[S1 • S2]` dari baris armada kendala per rute.
3. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx` — Penambahan uji otomatis untuk memastikan `S1 • S2` tidak lagi muncul di antarmuka.

---

## 4. Hasil Verifikasi Quality Gates

1. **Uji Unit Modal Detail Rute:**
   * Perintah: `pnpm vitest run src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`
   * Hasil: **17 passed (17 tests) — 100% PASS** (Termasuk verifikasi supresi `S1 • S2`).
2. **Uji Seluruh Komponen Monitoring:**
   * Perintah: `pnpm vitest run src/components/monitoring/`
   * Hasil: **17 passed (17 test files), 115 passed (115 tests) — 100% PASS**.
3. **Uji Kontrak Warna Token (WCAG AA):**
   * Perintah: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   * Hasil: **116 passed (116 tests) — 100% PASS**.
4. **Uji Keseluruhan Test Suite Vitest:**
   * Perintah: `pnpm vitest run src/`
   * Hasil: **131 passed (131 test files), 1,138 passed (1,138 tests) — 100% PASS**.
5. **TypeScript Strict Mode & Production Build:**
   * Perintah: `pnpm run build` (`tsc -b && vite build`)
   * Hasil: **0 error — Production build sukses**.
6. **Pembaruan Knowledge Graph (Graphify):**
   * Perintah: `graphify update .`
   * Hasil: **Graf pengetahuan kode terbarukan**.

