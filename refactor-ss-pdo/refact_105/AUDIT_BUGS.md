# Audit dan Status Bug Revisi Fase 3 Batch 3.1 (Koreksi Gerbang)

**Status Akhir:** `RESOLVED / READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_105/`

Dokumen ini mencatat resolusi tuntas atas temuan audit Codex dari `refact_104` (**R104-01**) mengenai kegagalan eksekusi perintah tes standar proyek `pnpm run test`.

---

## 1. R104-01 — Tes Reproduksi Historis Ikut Dieksekusi oleh Perintah Tes Standar (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `vite.config.ts` (menambahkan blok `test: { exclude: [...configDefaults.exclude, "refactor-ss-pdo/**"] }`)
- **Keparahan:** Sedang (Quality Gate & Kesiapan Pipeline)
- **Akar Masalah:**
  - Berkas bukti reproduksi pada siklus audit terdahulu (`refactor-ss-pdo/refact_103/evidence/reproduction-r102.test.tsx`) dibuat sengaja untuk membuktikan perilaku bug lama sebelum diperbaiki (menguji `hasCrossDayError === false` dan checkbox unmount menjadi `null`).
  - Karena berkas tersebut berakhiran `.test.tsx` dan berada di subdirektori proyek tanpa adanya exclude eksplisit pada konfigurasi Vitest, perintah tes standar `pnpm run test` (`vitest run`) memindai dan mengeksekusi berkas bukti tersebut.
  - Akibat kode aplikasi pada Batch 3.1 yang telah diperbaiki secara benar (checkbox kini tetap muncul dan tidak unmount), ekspektasi perilaku bug lama pada berkas arsip tersebut gagal, sehingga `pnpm run test` menghasilkan exit code 1 (1 failed / 84 passed).
- **Implementasi Perbaikan:**
  - Mengonfigurasi `vite.config.ts` dengan mengimpor `configDefaults` dan `defineConfig` dari `"vitest/config"`:
    ```typescript
    import { defineConfig, configDefaults } from "vitest/config";
    // ...
    export default defineConfig({
      // ...
      test: {
        exclude: [...configDefaults.exclude, "refactor-ss-pdo/**"],
      },
    });
    ```
  - **Preservasi Default Exclude:** Nilai default exclude Vitest (`**/node_modules/**`, `**/.git/**`, dll.) dipertahankan secara utuh melalui `...configDefaults.exclude`.
  - **Preservasi Cakupan Pengujian:** Pengujian sah di luar `src/` (seperti modul `.worktrees/`) tetap terdeteksi dan dieksekusi tanpa pemotongan cakupan sepihak.
  - **Integritas Bukti Sejarah:** Seluruh berkas bukti di `refactor-ss-pdo/` tetap dipertahankan 100% tanpa modifikasi atau penghapusan isi.
- **Dampak User/Tim & Mitigasi:**
  - Perintah tes standar `pnpm run test` kini lulus 100% dengan exit code 0, memberikan sinyal kualitas yang konsisten dan akurat pada pipeline CI/CD serta lingkungan pengembang lokal.

---

## 2. Matriks Status Temuan Fase 3 Batch 3.1

| ID Temuan | Komponen / Berkas | Deskripsi Singkat | Status Batch 3.1 |
|---|---|---|---|
| **R100-01** | `BusInputModal.tsx` | Mutasi langsung `validationErrors.length = 0` | **CLOSED** (diganti updater fungsional) |
| **R100-02** | `useBusInputForm.ts` $\to$ `busModalOdometer.ts` | Duplikasi logika sanitasi KM awal/akhir | **CLOSED** (diekstraksi & diuji unit 100%) |
| **R100-03** | `useBusInputForm.ts` | 4 `useEffect` prefill/sinkronisasi bertumpuk | **TRACKED** (dialokasikan ke Batch 3.2) |
| **R100-04** | `BusInputModal.tsx`, `useBusInputForm.ts` | Fallback hardcoded label trip | **CLOSED** (dimigrasikan ke `text_alerts.ts`) |
| **R100-05** | `BusInputModal.tsx` | Migrasi ke `ModalShell` standar | **TRACKED** (dialokasikan ke Batch 3.5) |
| **R102-01** | `useBusInputForm.ts` | Checkbox bypass tidak muncul pada Shift 1 parsial S2 | **CLOSED** (SSOT `getCrossDayValidationErrors`) |
| **R102-02** | `BusInputModal.tsx` | Checkbox bypass unmount saat error lintas hari dicentang | **CLOSED** (panel tetap mounted saat bypass aktif) |
| **R104-01** | `vite.config.ts` | Berkas bukti `refactor-ss-pdo/**` terpindai oleh `pnpm run test` | **CLOSED** (exclude `refactor-ss-pdo/**` via `configDefaults`) |

---

## 3. Bukti Verifikasi Pengujian

Seluruh berkas bukti verifikasi disimpan pada subdirektori `refactor-ss-pdo/refact_105/evidence/`:
1. `standard-test.txt`: Bukti `pnpm run test` tanpa filter lulus 100% (83 files / 604 tests passed, exit code 0).
2. `src-test.txt`: Bukti `pnpm run test src/` lulus 100% (83 files / 604 tests passed, exit code 0).
3. `build.txt`: Bukti kompilasi TypeScript dan bundler Vite produksi (`pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false`, exit code 0).
4. `config-lint.txt`: Laporan pemeriksaan oxlint pada `vite.config.ts` (0 error, 0 warning).
5. `git-status.txt`: Snapshot status git branch `devmode`.
