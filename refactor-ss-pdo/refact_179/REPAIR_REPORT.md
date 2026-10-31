# REPAIR REPORT — Refactor 179: Perbaikan Layout Bottom Sheet Detail Rute Monitoring Wilayah (Full-Width Fleet & Zero Void)

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`.

---

## 1. Ringkasan Perbaikan

Sesi ini menyelesaikan keluhan antarmuka (*UI/UX defect*) pada Bottom Sheet modal detail rute di halaman Monitoring Wilayah. Sebelumnya, tampilan modal terlihat asimetris dan rusak di layar ponsel: sisi kiri bawah kosong melompong (void navy), sementara sisi kanan terdesak sempit oleh daftar unit kendala. Perbaikan dilakukan dengan merestrukturisasi hirarki JSX yang bocor, membebaskan kontainer armada bus dari sel grid metrik, serta menyelaraskan pewarnaan dengan token semantik adaptif (Light & Dark Mode) berstandar industri.

---

## 2. Detail Implementasi & Before vs After

### Perbaikan 1: Restrukturisasi Hirarki JSX & Isolasi Grid Metrik (BUG-179-01)
* **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:557–795`
* **Before:**
  ```tsx
  {/* Row 3: KM Tempuh & Pelanggan / KM (2 columns) */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
    <div style={{ ... }}>KM Tempuh</div>
    <div style={{ ... }}>
      Pelanggan / KM Riil
      <div>Target & Cap</div>
      {/* TIDAK DITUTUP: langsung menyusul fleet section */}
      <div style={{ ... }}>Status Kesiapan Armada Bus</div>
    </div>
  </div>
  ```
  Blok Status Kesiapan Armada Bus bersarang di dalam kartu kanan grid 2 kolom. Akibatnya, lebar kontainer armada hanya ~170px (50% dari layar ponsel), teks kendala terpotong, badge berdesakan, dan area sebelah kiri kosong melompong setinggi seluruh daftar armada.
* **After:**
  ```tsx
  {/* Row 3: KM Tempuh & Pelanggan / KM (2 columns) */}
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%" }}>
    <div style={{ ... }}>KM Tempuh</div>
    <div style={{ ... }}>
      Pelanggan / KM Riil
      <div>Target & Cap</div>
    </div>
  </div>

  {/* Row 4: Status Kesiapan Armada Bus (FULL WIDTH SPANNING CONTAINER) */}
  <div
    data-testid="route-modal-fleet-section"
    style={{
      backgroundColor: "var(--color-surface-subtle)",
      borderRadius: "14px",
      padding: "14px",
      border: "1px solid var(--color-border-subtle)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      width: "100%",
      boxSizing: "border-box",
      marginTop: "2px",
    }}
  >
    {/* Header & Troubled Units List / Clean State */}
  </div>
  ```
  Kartu metrik baris 3 ditutup secara presisi. Bagian Status Kesiapan Armada Bus kini menjadi elemen kartu mandiri dengan lebar penuh (`width: 100%`) tepat di bawah baris metrik, membentang dari ujung kiri ke kanan secara proporsional.
* **Case: Skenario Lapangan:**
  Pengawas rute atau Korwil membuka Bottom Sheet rute `JAK.115` yang memiliki 7 unit armada dalam status kendala/libur (`OFF` / `BA.02`). Seluruh daftar bus kini tampil membentang penuh 100% selebar layar ponsel dengan latar kartu yang elegan. Tidak ada lagi ruang kosong hitam/navy di sebelah kiri, dan seluruh teks catatan kendala (seperti *"BA.02 Kendala Mesin (temperatur Radiator)"*) dapat dibaca dengan jelas tanpa terpotong.

---

### Perbaikan 2: Desain Ergonomis Item Armada Bus (Mobile-First)
* **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:722–808`
* **Before:**
  Item armada bus berada dalam kontainer sempit dengan flex column dan styling seadanya. Teks nomor bodi dan catatan kendala bertumpuk padat dan terdesak ke tepi kanan layar.
* **After:**
  Item armada bus didesain ulang dengan kartu bertingkat (*raised item card*):
  - Latar item: `var(--color-surface-default)` dengan border halus `var(--color-border-subtle)`.
  - Kolom kiri: Nomor bodi bus (`13px font-extrabold`) dengan spasi huruf lega (`letterSpacing: 0.2px`), serta catatan kendala di baris bawahnya (`11px text-secondary`) dengan pemotongan teks rapi (*text ellipsis*) dan atribut `title` untuk tooltip.
  - Kolom kanan: Badge status kendala (`OFF` / `T.O` / dll) dengan warna semantik khusus, berdampingan dengan penanda shift (`S1 • S2`) berlatar `var(--color-surface-subtle)`.
* **Case: Skenario Lapangan:**
  Petugas di lapangan dapat dengan cepat memindai unit mana yang mengalami gangguan dan shift berapa yang terdampak hanya dalam sekali lirik, baik saat ponsel digenggam dengan satu tangan di terminal maupun di dalam kendaraan dinas.

---

### Perbaikan 3: Penyelarasan Sistem Token Warna Semantik (Light & Dark Mode) (BUG-179-02)
* **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
* **Before:**
  Menggunakan hardcoded colors (`#18181b`, `#ffffff`, `#3ECF8E`, `#10B981`) dan variabel fallback lama yang tidak adaptif di tema terang (Light Mode).
* **After:**
  Seluruh komponen dimigrasikan secara menyeluruh ke CSS Variables dari `src/styles/tokens/semantic.css`:
  - Kanvas & Shell Modal: `var(--color-surface-default)`.
  - Kartu & Wadah Metrik: `var(--color-surface-subtle)`.
  - Teks Utama: `var(--color-text-primary)` (rasio kontras 17.85:1 Light / 13.9:1 Dark).
  - Teks Sekunder: `var(--color-text-secondary)`.
  - Tombol Buka Lembar Kerja: `var(--color-action-primary-bg)` & `var(--color-action-primary-fg)`.
  - Tombol Verifikasi/Check: `var(--color-success-fg)` & `var(--color-surface-default)`.
* **Case: Skenario Lapangan:**
  Saat operator mengubah tema ponsel dari Gelap ke Terang saat bekerja di luar ruangan pada siang hari, seluruh teks dan elemen Bottom Sheet tetap memiliki kontras tinggi yang tajam dan nyaman dibaca di bawah sinar matahari.

---

## 3. Daftar File yang Diubah & Ditambah

### File Ditambah:
1. `refactor-ss-pdo/refact_179/AUDIT_BUGS.md` — Dokumentasi temuan masalah, analisis akar masalah, dan matriks mitigasi.
2. `refactor-ss-pdo/refact_179/REPAIR_REPORT.md` — Laporan komprehensif implementasi perbaikan, Before vs After, dan skenario lapangan.

### File Dimodifikasi:
1. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` — Perbaikan penutupan tag JSX grid metrik, pemindahan armada bus ke kontainer mandiri full-width (100%), restrukturisasi tata letak kartu item bus, dan migrasi menyeluruh ke token warna semantik adaptif.
2. `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx` — Penambahan uji otomatis untuk memverifikasi tata letak top-level full-width pada seksi armada bus dan penolakan nesting di dalam grid.

---

## 4. Hasil Verifikasi Quality Gates

1. **Uji Unit Test Modal Detail Rute:**
   * Perintah: `pnpm vitest run src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`
   * Hasil: **17 passed (17 tests) — 100% PASS**.
2. **Uji Kontrak Warna Token (WCAG AA/AAA Accessibility):**
   * Perintah: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   * Hasil: **114 passed (114 tests) — 100% PASS**.
3. **Uji Komponen Monitoring Wilayah:**
   * Perintah: `pnpm vitest run src/components/monitoring/`
   * Hasil: **17 passed (17 test files), 115 passed (115 tests) — 100% PASS**.
4. **TypeScript Strict Mode & Production Build:**
   * Perintah: `pnpm run build` (`tsc -b && vite build`)
   * Hasil: **0 error — Production build sukses**.
5. **Pembaruan Knowledge Graph (Graphify):**
   * Perintah: `graphify update .`
   * Hasil: **Graf pengetahuan kode terbarukan**.

