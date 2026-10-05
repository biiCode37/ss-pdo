# Laporan Perbaikan Batch 2.1 Penutupan (Refact 88)

Tanggal: 27 September 2026. Auditor/Pelaksana: Gemini (executor). Branch: `devmode`. Keputusan: **READY_FOR_REVIEW**.

Laporan ini mendokumentasikan penutupan tuntas **Fase 2, Batch 2.1** untuk perbaikan temuan **R87-01** dari `refact_87/AUDIT_BUGS.md`. Seluruh perubahan lokal sebelumnya dan folder dokumentasi historis (`refact_84` s.d. `refact_87`) dipertahankan sepenuhnya tanpa modifikasi.

---

## 1. Ringkasan Eksekutif & Status Perbaikan

| ID Temuan | Komponen / Berkas | Status Implementasi | Status Verifikasi |
| :--- | :--- | :--- | :--- |
| **R87-01** | `MonitoringRouteDetailModal.tsx` & `text_monitoring.ts` | **SELESAI** | **100% LULUS** (Target test & Full suite 74 files / 531 tests pass) |

---

## 2. Rincian Implementasi (Before vs After)

### A. Penambahan Template Fungsi Murni pada Kamus Sentral (`src/constants/texts/text_monitoring.ts`)

#### Before:
```ts
      UNIT_RIT_PER_BUS: "Rit/Bus",
      UNIT_PAX_PER_BUS: "Org/Bus",
      UNIT_PAX_PER_KM: "Org/KM",
    },
```

#### After:
```ts
      UNIT_RIT_PER_BUS: "Rit/Bus",
      UNIT_PAX_PER_BUS: "Org/Bus",
      UNIT_PAX_PER_KM: "Org/KM",
      REALOPS_SHIFT_SUBTEXT: (s1: string | number, s2: string | number) =>
        `S1: ${s1} • S2: ${s2}`,
      TARGET_CAP_SUBTEXT: (target: string | number, cap: string | number) =>
        `Target: ${target} • Cap: ${cap}%`,
      ACHIEVEMENT_PCT: (pct: string | number) => `Capaian: ${pct}%`,
    },
```

---

### B. Migrasi Hardcoded String di Modal (`src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`)

#### Before:
```tsx
// Baris 441: Subteks Realops Shift 1 & 2
<div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
  S1: {route.realopsShift1 ?? "-"} • S2: {route.realopsShift2 ?? "-"}
</div>

// Baris 515: Subteks Target & Capaian Pelanggan/KM
<div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
  Target: {targetPaxPerKm} • Cap: {paxPerKmPct}%
</div>

// Baris 556: Persentase Capaian Target Pelanggan
<div style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-color, #3ECF8E)", marginTop: "1px" }}>
  Capaian: {paxPct}%
</div>
```

#### After:
```tsx
// Baris 441: Menggunakan fungsi template murni kamus
<div style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
  {tMetrics.REALOPS_SHIFT_SUBTEXT(route.realopsShift1 ?? "-", route.realopsShift2 ?? "-")}
</div>

// Baris 515: Menggunakan fungsi template murni kamus
<div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
  {tMetrics.TARGET_CAP_SUBTEXT(targetPaxPerKm, paxPerKmPct)}
</div>

// Baris 556: Menggunakan fungsi template murni kamus
<div style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-color, #3ECF8E)", marginTop: "1px" }}>
  {tMetrics.ACHIEVEMENT_PCT(paxPct)}
</div>
```

---

### C. Penambahan Uji Integritas Kamus Sentral (`src/constants/texts/texts.test.ts`)

Menambahkan pengujian langsung untuk memastikan ketiga template fungsi mengembalikan format string, tanda baca (`•`, `:`, `%`), dan spasi yang tepat:
```ts
    expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.REALOPS_SHIFT_SUBTEXT(10, 9)).toBe('S1: 10 • S2: 9');
    expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.TARGET_CAP_SUBTEXT('1.11', '107.2')).toBe('Target: 1.11 • Cap: 107.2%');
    expect(TEXT_MONITORING.ROUTE_DETAIL_MODAL.METRICS.ACHIEVEMENT_PCT('107.5')).toBe('Capaian: 107.5%');
```

---

## 3. Case: Skenario Lapangan

### Case 1: Komparasi Shift Realops pada Jam Operasional Pagi-Malam
- **Skenario Lapangan:** Petugas pengawas wilayah membuka kartu detail operasional pada pukul 14:00 saat Shift 1 telah selesai dan Shift 2 baru mulai. Realops Shift 1 bernilai `12` dan Shift 2 masih berstatus null/strip `-`.
- **Sebelum Perbaikan:** Teks `S1:` dan `S2:` di-hardcode dalam JSX. Jika ada lokalisasi atau standardisasi label shift (misal `"Shift 1"`, `"S-1"`), tampilan modal tidak tersinkronisasi dengan kamus utama.
- **Sesudah Perbaikan:** Fungsi `REALOPS_SHIFT_SUBTEXT("12", "-")` menghasilkan `"S1: 12 • S2: -"`. Label dan pemisah titik tengah terpusat di `text_monitoring.ts`.

### Case 2: Evaluasi Kinerja Rasio Pelanggan per KM (Target vs Riil)
- **Skenario Lapangan:** Pengawas rute memeriksa efektivitas rute di koridor sibuk. Target rasio adalah `1.15 Org/KM` dan ketercapaian aktual `95.4%`.
- **Sebelum Perbaikan:** Teks `Target:` dan `Cap:` ditulis secara langsung pada kode presentasional.
- **Sesudah Perbaikan:** Fungsi `TARGET_CAP_SUBTEXT("1.15", "95.4")` menghasilkan `"Target: 1.15 • Cap: 95.4%"`. Angka rasio desimal dipertahankan presisinya dan label bersumber dari SSOT kamus teks.

### Case 3: Monitoring Ketercapaian Target Harian Pelanggan
- **Skenario Lapangan:** Supervisor rute memeriksa total penumpang harian untuk melihat apakah rute mencapai target harian (misal `102.3%`).
- **Sebelum Perbaikan:** Teks `Capaian:` digabungkan langsung dengan `{paxPct}%` di JSX.
- **Sesudah Perbaikan:** Fungsi `ACHIEVEMENT_PCT("102.3")` menghasilkan `"Capaian: 102.3%"`. Perhitungan domain dan kalkulasi nonritase tetap murni tanpa ada perubahan logika angka.

---

## 4. Verifikasi & Quality Gates

| Gate | Perintah | Target Baseline | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Target Tests** | `pnpm vitest run src/constants/texts/texts.test.ts src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx` | 28 pass (0 fail) | **2 file / 28 tests pass (0 fail)** | **PASSED** |
| **Unit Test Suite** | `pnpm run test --dir src` | 74 file / 531 tests | **74 file / 531 tests pass (0 fail)** | **PASSED** |
| **ESLint** | `pnpm run lint` | Max 72 warnings, 0 errors | **72 warnings, 0 errors** (0 warning baru) | **PASSED** |
| **TypeScript & Build** | `pnpm run build` | Exit Code 0 | **Exit Code 0** (`tsc -b && vite build`) | **PASSED** |
| **Knowledge Graph** | `graphify update .` | AST rebuild | **Rebuilt: 5697 nodes, 9591 edges, 425 communities** | **PASSED** |

Bukti log terminal tersimpan di folder baru:
- `refactor-ss-pdo/refact_88/evidence/test-suite.txt`
- `refactor-ss-pdo/refact_88/evidence/lint.txt`
- `refactor-ss-pdo/refact_88/evidence/build.txt`

---

## 5. Daftar File yang Diubah

1. `src/constants/texts/text_monitoring.ts`: Penambahan template fungsi murni `REALOPS_SHIFT_SUBTEXT`, `TARGET_CAP_SUBTEXT`, dan `ACHIEVEMENT_PCT` pada `ROUTE_DETAIL_MODAL.METRICS`.
2. `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`: Penggantian 3 teks UI hardcoded pada baris 441, 515, dan 556 dengan template fungsi kamus teks sentral.
3. `src/constants/texts/texts.test.ts`: Penambahan uji integritas untuk ketiga template fungsi kamus baru.
4. `graphify-out/`: Sinkronisasi Knowledge Graph via `graphify update .`.
5. `refactor-ss-pdo/refact_88/`: Dokumentasi audit penutupan Batch 2.1 (`AUDIT_BUGS.md`, `REPAIR_REPORT.md`, dan `evidence/`).

---

## 6. Kriteria PASS Checklist

- [x] Seluruh label UI yang tampak pada modal target berasal dari kamus domain sentral (`src/constants/texts/text_monitoring.ts`).
- [x] Perubahan hanya pada copy source, tes kamus, dan output graf yang diperlukan.
- [x] Perilaku angka ritase PP murni dan nonritase tetap sama tanpa perubahan rumus domain.
- [x] Branch dipastikan tetap di `devmode`.
- [x] Seluruh folder dokumentasi lama (`refact_84` sampai `refact_87`) tidak disentuh atau diubah.
- [x] Tidak memulai Batch 2.2 sesuai instruksi.
