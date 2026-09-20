# 📋 Audit Bugs: Refactor 67 — Overnight Odometer Rollover & Cross-Day Validation

Dokumen audit ini mencatat temuan bug ketiadaan validasi lintas hari (*cross-day validation guard*) dan resiko anomali odometer mundur akibat pergantian kepala angka ribuan (*rollover*) pada aplikasi SS_PDO.

---

## Daftar Temuan Bug

### BUG-67-01: Ketiadaan Validasi Lintas Hari (Cross-Day Odometer Guard)
- **Lokasi Kode:** `src/utils/modals/busInput/busModalValidation.ts` & `src/components/busCard/modal/useBusInputForm.ts`.
- **Keparahan:** 🔴 Kritis (High / Data Anomaly & Physical Impossibility).
- **Deskripsi:** Sistem saat ini hanya memvalidasi pasangan KM Awal dan KM Akhir di hari yang sama (`numAkhir >= numAwal`), namun sama sekali tidak memvalidasi `KM Awal Shift 1 (Hari Ini)` terhadap `KM Hari Sebelumnya` (`previousDayKmAkhir2`).
- **Dampak User:** Jika terjadi pergantian kepala angka ribuan (misal kemarin `292990`, hari ini `293003`), petugas yang hanya mengetik sisa 3 digit (`003`) akan menghasilkan angka `292003`. Nilai ini lolos tanpa peringatan dan tersimpan ke spreadsheet, mengakibatkan odometer tercatat mundur -987 KM.
- **Mitigasi:** Tambahkan fungsi `validateKmCrossDay(kmAwalToday, kmPreviousDay, shiftLabel)` untuk memblokir penyimpanan jika KM Awal hari ini lebih kecil dari KM hari sebelumnya, lengkap dengan pesan edukatif mengenai kemungkinan rollover ribuan.

---

### BUG-67-02: Ketiadaan Bantuan Koreksi Cepat Rollover (Smart Rollover Suggestion)
- **Lokasi Kode:** `src/components/busCard/modal/useBusInputForm.ts`, `BusInputModalShift1.tsx`, & `BusInputModalSingleFocus.tsx`.
- **Keparahan:** 🟡 Sedang (Medium / UX Inconvenience).
- **Deskripsi:** Ketika rollover terjadi dan petugas salah menghasilkan angka yang lebih kecil, petugas harus memindahkan kursor ke depan, menghapus 3 digit lama (`292`), dan mengetik 3 digit baru (`293`). Hal ini memperlambat proses input di lapangan.
- **Dampak User:** Frustrasi dan potensi salah ketik berulang saat menghapus digit di ponsel lapangan.
- **Mitigasi:** Bangun pendeteksi rollover cerdas di hook form yang otomatis mengenali jika kepala angka dinaikkan +1 menghasilkan selisih positif wajar ($0 < \text{diff} \le 100\text{ KM}$), lalu tampilkan tombol/chip saran 1-klik `[Gunakan 293.003]` untuk mengoreksi angka seketika.
