# 🛠️ Repair Report: Refactor 67 — Overnight Odometer Rollover & Cross-Day Validation Guard

Dokumen ini mencatat detail implementasi perbaikan, perbandingan **Before vs After**, serta **Case: Skenario Lapangan** untuk perbaikan bug BUG-67-01 dan BUG-67-02.

---

## 1. Implementasi Perbaikan

### A. BUG-67-01: Validasi Lintas Hari (Cross-Day Odometer Guard)
- **Modul:** `src/utils/modals/busInput/busModalValidation.ts` & `src/components/busCard/modal/useBusInputForm.ts`.
- **Implementasi:**
  - Membuat fungsi `validateKmCrossDay(kmAwalRaw, kmPreviousDayRaw, shiftLabel, previousDayDateLabel, bypassReset)`:
    1. Membandingkan secara numerik nilai KM Awal hari ini dengan nilai KM penutup hari kemarin (`previousDayKmAkhir2`).
    2. Melewati validasi jika salah satu field kosong atau berupa draf prefill ($\le 3$ digit).
    3. Melewati validasi jika flag `bypassReset` aktif (misal speedometer diganti baru/reset bengkel).
    4. Mengembalikan pesan edukatif ramah non-teknis dengan informasi selisih minus KM jika `kmAwal < kmPreviousDay`.
  - Diintegrasikan ke `useBusInputForm.ts` pada mode tunggal (*Single Column Focus*) untuk `kmAwal1` dan `kmAwal2` (Skenario B: bus dinas siang saja), serta mode Multi-Tab (All).

### B. BUG-67-02: Bantuan Koreksi Cepat Rollover (Smart Rollover Suggestion) & Tombol 1-Klik
- **Modul:** `src/utils/modals/busInput/busModalValidation.ts`, `src/components/busCard/modal/useBusInputForm.ts`, `BusInputModalShift1.tsx`, `BusInputModalSingleFocus.tsx`, & `BusInputModal.tsx`.
- **Implementasi:**
  - Membuat fungsi `detectSmartRollover(kmAwalRaw, kmPreviousDayRaw)`:
    - Menghitung kandidat rollover dengan menaikkan 3 digit kepala angka +1 (contoh: `292003` -> prefix `292` + 1 = `293` -> `293003`).
    - Jika selisih maju berada dalam batas toleransi wajar ($0 < \text{diff} \le 100\text{ KM}$), mengembalikan `{ suggestedKm: "293003", diff: 13 }`.
  - Di form hook (`useBusInputForm.ts`), menyediakan `smartRolloverSuggestion` dan fungsi 1-klik `handleApplyRollover()` yang otomatis:
    1. Mengganti angka KM Awal ke angka saran.
    2. Menyelaraskan draf prefill KM Akhir (jika masih draf $\le 3$ digit) ke kepala angka baru.
    3. Menghapus pesan error validasi mundur odometer.
  - Di UI antarmuka (`BusInputModalShift1.tsx`, `BusInputModalSingleFocus.tsx`, dan bar error `BusInputModal.tsx`), menampilkan banner saran aksen amber dengan ikon `Sparkles` dan tombol 1-klik `[Gunakan {suggestedKm}]`.
  - Menyediakan opsi checkbox ramah `[ ] Abaikan (Speedometer baru / reset bengkel)` untuk situasi penggantian unit speedometer dari depo/bengkel.

---

## 2. Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Validasi KM Lintas Hari** | Tidak ada validasi antara KM Awal hari ini dengan KM penutup hari kemarin. Angka minus lolos ke spreadsheet. | Dilindungi oleh `validateKmCrossDay`. Form memblokir submit dan memberi tahu petugas selisih minus secara transparan. |
| **Penanganan Rollover Kepala Ribuan** | Petugas harus manual menghapus 3 digit lama, memindahkan kursor, dan mengetik ulang digit kepala baru di HP. | Muncul deteksi cerdas *Smart Rollover* seketika di bawah input dengan tombol 1-klik `[Gunakan {suggestedKm}]`. |
| **Sinkronisasi Draf KM Akhir** | Jika KM Awal berganti kepala ribuan, draf KM Akhir tertinggal pada kepala lama sehingga memicu salah validasi. | `handleApplyRollover()` otomatis menyelaraskan draf prefill KM Akhir ke kepala angka baru yang benar. |
| **Penggantian Speedometer Bengkel** | Tidak ada mekanisme bypass, input odometer baru beresiko terkunci permanen jika nilainya lebih kecil dari hari kemarin. | Disediakan checkbox darurat `bypassOdometerReset` untuk kasus resmi penggantian speedometer baru di bengkel. |

---

## 3. Case: Skenario Lapangan

### Case 1: Perjalanan Depo Malam Hari Melewati Kepala Ribuan
- **Kondisi Awal:**
  - Bus TJ-0284 selesai dinas Shift 2 kemarin pada KM Akhir = `292990`.
  - Malam hari bus bergerak isi bahan bakar dan parkir di depo sejauh 13 KM sehingga odometer fisik pagi ini menunjukkan `293003`.
- **Interaksi Petugas:**
  - Di aplikasi, form KM Awal S1 ter-prefill 3 digit `292` (dari hari kemarin).
  - Petugas pagi melihat speedometer fisik `293003`, lalu mengetik 3 digit akhir `003`.
  - Terbentuk angka `292003`.
- **Hasil di Sistem:**
  - Seketika muncul chip saran cerdas: *"Saran Otomatis: Pergantian Ribuan KM — Odometer terindikasi melewati kepala ribuan saat pergantian dinas/perjalanan depo (+13 KM). Disarankan menggunakan 293003."*
  - Petugas cukup menekan tombol `[Gunakan 293003]`. Angka langsung berubah menjadi `293003` dan draf KM Akhir diselaraskan menjadi `293`.
  - Jika petugas langsung menekan tombol Simpan tanpa koreksi, sistem menolak submit dengan pesan informatif: *"KM Awal Shift 1 (292003) tidak boleh lebih kecil dari Kemarin (292990). Selisih minus 987 KM. Periksa kemungkinan kepala angka odometer telah berganti."*

### Case 2: Bus Menginap di Halte / Tidak Berpindah
- **Kondisi Awal:** Kemarin `292990`, hari ini pagi `292990` (selisih 0 KM).
- **Hasil di Sistem:** Lolos validasi tanpa kendala dan tanpa salah peringatan.

### Case 3: Bus Mengganti Speedometer Baru di Bengkel
- **Kondisi Awal:** Kemarin odometer `292990`, bus rusak speedometer dan diganti baru dari bengkel sehingga angka kembali ke `001200`.
- **Hasil di Sistem:** Petugas mencentang kotak `[x] Abaikan (Speedometer baru / reset bengkel)`, dan sistem mengizinkan penyimpanan angka `001200` ke spreadsheet tanpa hambatan.
