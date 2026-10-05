# Audit dan Status Bug Revisi Fase 3 Batch 3.2 (Koreksi Rollover & Errata Laporan)

**Status Akhir:** `RESOLVED / READY_FOR_REVIEW`  
**Branch:** `devmode`  
**Folder Dokumentasi:** `refactor-ss-pdo/refact_109/`

Dokumen ini mencatat resolusi atas temuan audit Codex dari `refact_108` (**R108-01** dan **R108-02**) terkait pemilihan target smart rollover berdasarkan kesamaan nilai numerik serta koreksi atas klaim laporan implementasi terdahulu.

---

## 1. R108-01 — Pemilihan Target Smart Rollover Menggunakan Kesamaan String Nilai (CLOSED)

- **Status:** **CLOSED**
- **Lokasi Kode:**
  - `src/components/busCard/modal/useBusModalOdometer.ts:364-415`
  - `src/components/busCard/modal/useBusModalOdometer.test.tsx` (Test 9, 10, 11, 12)
  - `src/components/busCard/modal/useBusInputForm.test.tsx` (Uji form-level)
- **Keparahan:** Sedang–Tinggi (Integritas Data Odometer & Akurasi Pencatatan Lapangan)
- **Akar Masalah:**
  - Pada implementasi awal Batch 3.2 (`refact_107`), `applyRollover()` menentukan field mana yang diperbarui dengan membandingkan nilai string:
    ```typescript
    if (targetKmAwalForRollover === kmAwal2) {
      setKmAwal2(smartRolloverSuggestion.suggestedKm);
      // ...
    } else {
      setKmAwal1(smartRolloverSuggestion.suggestedKm);
      // ...
    }
    ```
  - Jika modal berada pada tab `shift1` dengan `kmAwal1 = "292003"` dan `kmAwal2 = "292003"` (karena bus hasil copy KM atau data parsial), `targetKmAwalForRollover` yang bernilai `"292003"` sama persis dengan `kmAwal2`.
  - Akibatnya, kondisi `targetKmAwalForRollover === kmAwal2` bernilai `true` meskipun target yang dimaksud adalah Shift 1. Fungsi lalu mengubah `kmAwal2` ke `293003` dan membiarkan `kmAwal1` tetap `292003`.
- **Implementasi Perbaikan:**
  1. **Penetapan Identitas Shift Eksplisit (`rolloverTargetShift`):**
     - Mendefinisikan identitas target secara eksplisit bertipe `"shift1" | "shift2" | null`:
       ```typescript
       const rolloverTargetShift = useMemo<"shift1" | "shift2" | null>(() => {
         if (isSingleMode) {
           if (effectiveCategory === "kmAwal2" || effectiveCategory === "kmAkhir2") {
             const hasShift1 =
               (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
               (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
             if (!hasShift1) return "shift2";
             return null;
           }
           return "shift1";
         }
         if (activeTab === "shift2") {
           const hasShift1 =
             (bus.kmAwal1 && bus.kmAwal1.trim() !== "") ||
             (kmAwal1 && kmAwal1.trim() !== "" && kmAwal1.trim().length > 3);
           if (!hasShift1) return "shift2";
           return null;
         }
         return "shift1";
       }, [isSingleMode, effectiveCategory, activeTab, bus.kmAwal1, kmAwal1]);
       ```
  2. **Harmonisasi Sumber Nilai & Aplikasi Saran:**
     - `targetKmAwalForRollover` mengambil nilai dari shift yang diidentifikasi oleh `rolloverTargetShift` (`rolloverTargetShift === "shift2" ? kmAwal2 : rolloverTargetShift === "shift1" ? kmAwal1 : ""`).
     - `applyRollover()` memperbarui field berdasarkan identitas shift tersebut (`rolloverTargetShift === "shift2"` memperbarui `kmAwal2`, sedangkan `rolloverTargetShift === "shift1"` memperbarui `kmAwal1`), **bukan** membandingkan kesamaan angka string.
- **Dampak User & Mitigasi:**
  - Ketika petugas berada di tab Shift 1 dan menekan saran rollover `293003`, HANYA `kmAwal1` yang berubah menjadi `293003`. Nilai `kmAwal2` tetap terjaga pada `292003`.
  - Integritas pencatatan kilometer antar-shift terjaga 100%.

---

## 2. R108-02 — Errata Laporan Implementasi & Klarifikasi Lifecycle Modal (CLOSED)

- **Status:** **CLOSED (ERRATA TERCATAT)**
- **Lokasi Dokumen:**
  - `refactor-ss-pdo/refact_107/AUDIT_BUGS.md:36`
  - `refactor-ss-pdo/refact_107/REPAIR_REPORT.md:32`
- **Keparahan:** Rendah (Akurasi Dokumentasi & Audit Arsitektur)
- **Koreksi Fakta (Errata):**
  1. **Ukuran Berkas:** Laporan `refact_107` menyebut `useBusModalOdometer.ts` sekitar 190 baris dan `useBusInputForm.ts` turun menjadi sekitar 235 baris. Ukuran aktual saat review baseline adalah **445 baris** untuk `useBusModalOdometer.ts` dan **722 baris** untuk `useBusInputForm.ts` (saat ini setelah perbaikan R108-01: masing-masing **451 baris** dan **722 baris**).
  2. **Fungsi Reset Fiktif:** Laporan `refact_107` mengklaim adanya helper `resetOdometerStates`. Fungsi tersebut **tidak ada** dalam implementasi kode dan **tidak diperlukan**.
- **Klarifikasi Lifecycle Modal Aktual:**
  - Pada `src/components/busCard/BusCard.tsx:178`, modal dirender secara kondisional:
    ```tsx
    {isModalOpen && (
      <BusInputModal
        isOpen={isModalOpen}
        bus={{ ...bus, ...formData }}
        // ...
      />
    )}
    ```
  - Ketika modal ditutup atau berganti unit bus, instance komponen `BusInputModal` di-*unmount* dari DOM.
  - Saat modal dibuka kembali untuk bus lain atau bus yang sama, React me-*mount* ulang komponen secara *fresh*, sehingga hook `useBusInputForm` dan sub-hook `useBusModalOdometer` menginisialisasi state awal secara bersih langsung dari props bus yang baru.
  - Oleh karena itu, penambahan fungsi reset manual adalah antipola (tidak dibutuhkan/YAGNI). Tidak ada penambahan fungsi buatan untuk sekadar memenuhi dokumen.

---

## 3. Matriks Status Temuan Fase 3

| ID Temuan | Komponen / Berkas | Deskripsi Singkat | Status Siklus |
|---|---|---|---|
| **R100-01** | `BusInputModal.tsx` | Mutasi langsung `validationErrors.length = 0` | **CLOSED** (Batch 3.1) |
| **R100-02** | `useBusInputForm.ts` $\to$ `busModalOdometer.ts` | Duplikasi logika sanitasi KM awal/akhir | **CLOSED** (Batch 3.1) |
| **R100-03** | `useBusInputForm.ts` $\to$ `useBusModalOdometer.ts` | Sub-hook odometer & 4 `useEffect` exhaustive-deps | **CLOSED** (Batch 3.2) |
| **R100-04** | `BusInputModal.tsx`, `useBusInputForm.ts` | Fallback hardcoded label trip | **CLOSED** (Batch 3.1) |
| **R100-05** | `BusInputModal.tsx` | Migrasi ke `ModalShell` standar | **TRACKED** (Batch 3.5) |
| **R102-01** | `useBusInputForm.ts` | Checkbox bypass tidak muncul pada Shift 1 parsial S2 | **CLOSED** (Batch 3.1 Rev) |
| **R102-02** | `BusInputModal.tsx` | Checkbox bypass unmount saat error lintas hari dicentang | **CLOSED** (Batch 3.1 Rev) |
| **R104-01** | `vite.config.ts` | Berkas bukti `refactor-ss-pdo/**` terpindai oleh `pnpm run test` | **CLOSED** (Batch 3.1 Gate) |
| **R108-01** | `useBusModalOdometer.ts` | Kesamaan string KM Awal memicu target rollover salah | **CLOSED** (Batch 3.2 Rev) |
| **R108-02** | `AUDIT_BUGS.md` / `REPAIR_REPORT.md` | Errata klaim baris kode & fungsi reset fiktif | **CLOSED** (Batch 3.2 Rev) |

---

## 4. Bukti Verifikasi Pengujian & Kualitas

Seluruh berkas bukti eksekusi disimpan pada folder `refactor-ss-pdo/refact_109/evidence/`:
1. `reproduction-r108-01.txt`: Bukti kegagalan tes reproduksi sebelum perbaikan R108-01 dieksekusi.
2. `targeted-tests.txt`: Eksekusi 10 berkas tes terkait odometer, form modal, kartu bus, dan save (10 files, 121 tests passed, 0 failed).
3. `standard-tests.txt`: Eksekusi `pnpm run test` tanpa filter (84 test files, 620 tests passed, 0 failed).
4. `src-tests.txt`: Eksekusi `pnpm run test src/` (84 test files, 620 tests passed, 0 failed).
5. `targeted-lint.txt`: Eksekusi oxlint pada berkas yang disentuh (0 error, 0 warning `exhaustive-deps`).
6. `build.txt`: Eksekusi `pnpm exec tsc -b; pnpm exec vite build --emptyOutDir false` (exit code 0, 2043 modules transformed).
7. `git-status.txt`: Snapshot status git branch `devmode`.
