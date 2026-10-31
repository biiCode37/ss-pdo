# REPAIR REPORT — Refactor 180: Diferensiasi Warna Badge BA (Berita Acara) vs Badge OFF (Libur)

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/styles/tokens/semantic.css`, `src/styles/tokens/color-contract.test.ts`, `src/components/monitoring/monitoringUtils.ts`, `src/components/monitoring/monitoringUtils.test.ts`, `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`, `src/index.css`.

---

## 1. Ringkasan Perbaikan

Sesi ini menyelesaikan ketidakjelasan visual antara badge status unit `OFF` (armada libur normal) dan `BA` (Berita Acara insiden/kendala lapangan) pada daftar armada bus bermasalah di Bottom Sheet rute dan tab Status Kesiapan Armada. Sebelumnya, kedua jenis badge tersebut menggunakan warna kuning/amber yang persis sama. Sesuai arahan pengguna, status `OFF` tetap dipertahankan bernuansa Kuning/Amber, sedangkan badge `BA` (`BA.01` s/d `BA.06`) kini dialihkan ke warna Oranye (*operational orange*) yang relevan, tegas, dan kontras terhadap semua status armada lainnya.

---

## 2. Detail Implementasi & Before vs After

### Perbaikan 1: Standarisasi Token Warna Semantik Oranye untuk Berita Acara (BUG-180-01)
* **Lokasi:** `src/styles/tokens/semantic.css`, `src/styles/tokens/color-contract.test.ts`
* **Before:**
  Belum tersedia token warna semantik khusus untuk badge Berita Acara (`BA`). Fungsi inferensi terpaksa menduplikasi token `--color-warning-*` (kuning) untuk BA.
* **After:**
  Didefinisikan token semantik baru yang adaptif terhadap 2 tema (Light & Dark Mode):
  - **Light Mode:**
    * `--color-badge-ba-bg: var(--p-orange-50)` (`#FFF7ED`)
    * `--color-badge-ba-fg: var(--p-orange-800)` (`#9A3412`)
    * `--color-badge-ba-border: var(--p-orange-200)` (`#FED7AA`)
  - **Dark Mode:**
    * `--color-badge-ba-bg: var(--p-orange-950)` (`#431407`)
    * `--color-badge-ba-fg: var(--p-orange-300)` (`#FDBA74`)
    * `--color-badge-ba-border: var(--p-orange-800)` (`#9A3412`)
  - Ditambahkan ke suite `color-contract.test.ts` untuk menjamin kepatuhan rasio kontras WCAG AA (rasio kontras 6.83:1 Light / 8.6:1 Dark).
* **Case: Skenario Lapangan:**
  Pengawas rute membuka aplikasi di terik matahari siang hari. Badge `BA.02` yang berlatar oranye lembut dengan teks cokelat-oranye gelap terbaca tajam dan tidak menyilaukan mata, sekaligus terlihat berbeda jelas dari badge `OFF` yang berwarna kuning keemasan.

---

### Perbaikan 2: Pembaruan Engine Inferensi Status (`inferStatusCode`)
* **Lokasi:** `src/components/monitoring/monitoringUtils.ts:198–255`
* **Before:**
  ```ts
  // 4. BA Code (Berita Acara / Laka / Sakit / Kendala Operasi)
  const baMatch = note.match(/\bBA[\s.]?0?([1-6])\b/i);
  if (baMatch) {
    return {
      code: `BA.0${baMatch[1]}`,
      color: "var(--color-warning-fg)", // KUNING SAMA DENGAN OFF
      bg: "var(--color-warning-bg)",
    };
  }
  ```
* **After:**
  ```ts
  // 4. BA Code (Berita Acara / Laka / Sakit / Kendala Operasi) - Oranye Khas Berita Acara
  const baMatch = note.match(/\bBA[\s.]?0?([1-6])\b/i);
  if (baMatch) {
    return {
      code: `BA.0${baMatch[1]}`,
      color: "var(--color-badge-ba-fg)", // ORANYE BERITA ACARA
      bg: "var(--color-badge-ba-bg)",
      border: "var(--color-badge-ba-border)",
    };
  }
  ```
  Status `OFF` tetap menggunakan `var(--color-warning-fg)`, `var(--color-warning-bg)`, dan `var(--color-warning-border)`. Seluruh status juga dilengkapi atribut `border` untuk mempertegas batas visual badge di latar belakang kartu gelap/terang.
* **Case: Skenario Lapangan:**
  Pada rute `JAK.115`, armada yang libur seperti `KWK 222162 [OFF]` langsung dikenali berwarna kuning, sementara armada yang mengalami kendala operasional lapangan seperti `KWK 222176 [BA.02]` dan `KWK 222180 [BA.02]` langsung menyala berwarna oranye. Dalam satu tatapan cepat (kurang dari 1 detik), pengawas langsung mengetahui unit mana yang mengalami gangguan teknis/insiden resmi.

---

### Perbaikan 3: Penyelarasan Komponen Tampilan & CSS Global
* **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`, `src/index.css`
* **Before:**
  - Badge di modal dan tab monitoring tidak memanfaatkan properti `badgeBorder`.
  - `.note-badge-ba` di `src/index.css` masih menggunakan warna merah `rgba(239, 68, 68, ...)` mentah yang tidak selaras dengan token semantik.
* **After:**
  - Komponen modal detail rute dan tab armada kini merender `border: u.badgeBorder ? 1px solid ${u.badgeBorder} : "none"`.
  - `.note-badge-ba` di `src/index.css` dimigrasikan ke `var(--color-badge-ba-bg)`, `var(--color-badge-ba-border)`, dan `var(--color-badge-ba-fg)`, menyatukan identitas visual di seluruh aplikasi.

---

## 3. Matriks Spektrum Warna Status Armada Pasca-Perbaikan

| Kode Status | Makna Operasional | Token Warna Semantik | Nuansa Visual |
|---|---|---|---|
| **`SGO` / `RENOP`** | Siap Guna Operasi (Normal) | `var(--color-success-*)` | **Hijau** (Emerald) |
| **`OFF`** | Libur Terjadwal / Rencana Istirahat | `var(--color-warning-*)` | **Kuning / Amber** |
| **`BA.01` s/d `BA.06`** | Berita Acara (Insiden / Kendala Fisik Lapangan) | `var(--color-badge-ba-*)` | **Oranye** (*Operational Orange*) |
| **`TEKNIS` / `SO`** | Perbaikan Bengkel / Stop Operasi | `var(--color-shift-2-*)` | **Ungu / Violet** |
| **`T.O` / `TO EVDAL`** | Tidak Operasi / Rusak Parah | `var(--color-error-*)` | **Merah** (Crimson) |
| **`KEUR` / `OKB`** | Uji Berkala / Operasi Khusus | `var(--color-shift-1-*)` / `var(--color-info-*)` | **Biru / Sky** |

---

## 4. Daftar File yang Diubah & Ditambah

### File Ditambah:
1. `refactor-ss-pdo/refact_180/AUDIT_BUGS.md` — Dokumentasi temuan `BUG-180-01` dan mitigasi desain.
2. `refactor-ss-pdo/refact_180/REPAIR_REPORT.md` — Laporan Before vs After, spektrum warna, dan skenario lapangan.

### File Dimodifikasi:
1. `src/styles/tokens/semantic.css` — Penambahan token semantik `--color-badge-ba-bg`, `--color-badge-ba-fg`, dan `--color-badge-ba-border` (Light & Dark).
2. `src/styles/tokens/color-contract.test.ts` — Pendaftaran kontrak rasio kontras WCAG AA untuk badge BA.
3. `src/components/monitoring/monitoringUtils.ts` — Pemetaan `BA` ke token oranye dan penambahan properti border pada seluruh status.
4. `src/components/monitoring/monitoringUtils.test.ts` — Uji verifikasi diferensiasi BA vs OFF.
5. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` — Penerapan border penegas pada badge unit kendala.
6. `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx` — Penerapan border dan token oranye pada tab Status Armada.
7. `src/index.css` — Standardisasi class `.note-badge-ba` ke token semantik oranye.

---

## 5. Hasil Verifikasi Quality Gates

1. **Uji Kontrak Warna Token (WCAG AA Accessibility):**
   * Perintah: `pnpm vitest run src/styles/tokens/color-contract.test.ts`
   * Hasil: **116 passed (116 tests) — 100% PASS** (Rasio kontras oranye > 6.8:1 Light dan > 8.6:1 Dark).
2. **Uji Utilitas Inferensi & Monitoring:**
   * Perintah: `pnpm vitest run src/components/monitoring/`
   * Hasil: **17 passed (17 test files), 115 passed (115 tests) — 100% PASS**.
3. **Uji Keseluruhan Test Suite Vitest:**
   * Perintah: `pnpm vitest run src/`
   * Hasil: **131 passed (131 test files), 1,138 passed (1,138 tests) — 100% PASS**.
4. **TypeScript Strict Mode & Production Build:**
   * Perintah: `pnpm run build` (`tsc -b && vite build`)
   * Hasil: **0 error — Production build sukses**.
5. **Pembaruan Knowledge Graph (Graphify):**
   * Perintah: `graphify update .`
   * Hasil: **Graf pengetahuan kode terbarukan**.

